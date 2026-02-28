"""
Celery tasks for AI background processing.

Worker startup:
    celery -A app.tasks.ai_tasks worker --loglevel=info
"""
from __future__ import annotations

import asyncio
import json
import logging

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


# ── Async implementation (reused by both Celery and asyncio fallback) ─────────

async def _run_ai_analysis(control_id: str, description: str) -> None:
    """Core async logic: call AI, parse JSON, persist to DB."""
    from uuid import UUID
    from sqlalchemy.future import select
    from app.db.database import AsyncSessionLocal
    from app.models.control import InternalControl
    from app.services.ai_service import AIService

    async with AsyncSessionLocal() as db:
        try:
            raw = await AIService.analyze_control(description)

            stmt = select(InternalControl).where(InternalControl.id == UUID(control_id))
            control = (await db.execute(stmt)).scalars().first()
            if not control:
                logger.warning("Control %s not found; skipping AI save", control_id)
                return

            control.ai_analysis = raw

            try:
                data = json.loads(raw)
                suggested = data.get("suggested_risk", "").upper()
                if suggested in ("HIGH", "MEDIUM", "LOW"):
                    control.ai_suggested_risk = suggested
                    confidence = float(data.get("confidence", 0))
                    if confidence >= 0.75:
                        control.risk_score = control.risk_score.__class__[suggested]

                control.ai_category   = data.get("category") or None
                control.ai_confidence = float(data["confidence"]) if "confidence" in data else None

                gaps = data.get("gaps", [])
                recs = data.get("recommendations", [])
                summ = data.get("summary", "")
                control.ai_analysis = (
                    f"{summ}\n\n"
                    + ("Gaps:\n" + "\n".join(f"• {g}" for g in gaps) + "\n\n" if gaps else "")
                    + ("Recommendations:\n" + "\n".join(f"• {r}" for r in recs) if recs else "")
                ).strip()

            except (json.JSONDecodeError, ValueError, KeyError):
                logger.debug("AI returned non-JSON for control %s — storing raw", control_id)

            await db.commit()
            logger.info("AI analysis saved for control %s", control_id)

        except Exception as exc:
            logger.error("AI analysis failed for control %s: %s", control_id, exc)
            raise


# ── Celery task ────────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    name="app.tasks.ai_tasks.run_ai_analysis",
    max_retries=3,
    default_retry_delay=30,
    acks_late=True,
)
def run_ai_analysis(self, control_id: str, description: str) -> None:
    """
    Celery task: run AI analysis for a control.

    Dispatched via:  run_ai_analysis.delay(str(control_id), description)
    """
    try:
        asyncio.run(_run_ai_analysis(control_id, description))
    except Exception as exc:
        logger.error("Celery AI task failed for control %s: %s", control_id, exc)
        raise self.retry(exc=exc)
