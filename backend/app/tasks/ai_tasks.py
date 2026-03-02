"""
Celery tasks for AI background processing.

Worker startup (dev):
    celery -A app.tasks.ai_tasks worker --loglevel=info

With Celery Beat (daily snapshots):
    celery -A app.tasks.ai_tasks worker --beat --loglevel=info
"""
from __future__ import annotations

import asyncio
import json
import logging

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


# ── Shared async core ─────────────────────────────────────────────────────────

async def _run_ai_analysis(control_id: str, description: str) -> None:
    """
    Core async logic shared by both the Celery task and the asyncio fallback.

    AI status lifecycle:
        pending  →  processing  →  done
                                →  failed   (Celery will retry up to max_retries)
    """
    from uuid import UUID
    from sqlalchemy.future import select
    from app.db.database import AsyncSessionLocal
    from app.models.control import InternalControl
    from app.services.ai_service import AIService

    async with AsyncSessionLocal() as db:
        stmt    = select(InternalControl).where(InternalControl.id == UUID(control_id))
        control = (await db.execute(stmt)).scalars().first()
        if not control:
            logger.warning("Control %s not found; skipping AI", control_id)
            return

        # Mark as processing so the UI can show a live spinner
        control.ai_status = "processing"
        await db.commit()

        try:
            # ─ call AI ─────────────────────────────────────────────────────
            raw = await AIService.analyze_control(description)

            # ─ safe JSON parse with guaranteed fallback ─────────────────────
            # LLMs occasionally return markdown prose instead of valid JSON.
            # We never crash — we store whatever we got as the summary instead.
            try:
                data = json.loads(raw)
            except (json.JSONDecodeError, ValueError):
                logger.warning(
                    "AI returned non-JSON for control %s — storing raw text", control_id
                )
                data = {
                    "suggested_risk": None,
                    "category": None,
                    "confidence": None,
                    "gaps": [],
                    "recommendations": [],
                    "summary": raw,
                }

            # ─ populate structured fields ───────────────────────────────────
            suggested = (data.get("suggested_risk") or "").upper()
            if suggested in ("HIGH", "MEDIUM", "LOW"):
                control.ai_suggested_risk = suggested
                # Auto-escalate actual risk when AI confidence ≥ 75%
                try:
                    confidence_val = float(data.get("confidence") or 0)
                except (TypeError, ValueError):
                    confidence_val = 0.0
                if confidence_val >= 0.75:
                    control.risk_score = control.risk_score.__class__[suggested]

            control.ai_category = data.get("category") or None

            try:
                control.ai_confidence = (
                    float(data["confidence"]) if data.get("confidence") is not None else None
                )
            except (TypeError, ValueError):
                control.ai_confidence = None

            # Build human-readable analysis text from the structured fields
            gaps = data.get("gaps") or []
            recs = data.get("recommendations") or []
            summ = data.get("summary") or ""
            control.ai_analysis = (
                f"{summ}\n\n"
                + ("Gaps:\n" + "\n".join(f"• {g}" for g in gaps) + "\n\n" if gaps else "")
                + ("Recommendations:\n" + "\n".join(f"• {r}" for r in recs) if recs else "")
            ).strip() or raw

            control.ai_status = "done"
            await db.commit()
            logger.info("AI analysis saved for control %s", control_id)

        except Exception as exc:
            # Mark as failed so the frontend can offer a manual retry button
            control.ai_status = "failed"
            await db.commit()
            logger.error("AI analysis failed for control %s: %s", control_id, exc)
            raise  # re-raise so Celery picks it up for retry


# ── Celery task — retry with exponential back-off ─────────────────────────────

@celery_app.task(
    bind=True,
    name="app.tasks.ai_tasks.run_ai_analysis",
    acks_late=True,             # only ack after success; re-queue if worker crashes
    autoretry_for=(Exception,), # Celery auto-retries on ANY exception
    retry_backoff=True,         # exponential back-off: 1 s → 2 s → 4 s …
    retry_backoff_max=300,      # never wait more than 5 minutes between retries
    max_retries=3,              # 3 retries = 4 total attempts
    retry_jitter=True,          # randomise delay to avoid thundering-herd storms
)
def run_ai_analysis(self, control_id: str, description: str) -> None:
    """
    Celery task: run AI analysis for a single control in the background.

    Dispatched from control_service via:
        run_ai_analysis.delay(str(control.id), control.description)

    Retry schedule (approximate with jitter):
        Attempt 1 → failure → wait ~1 s
        Attempt 2 → failure → wait ~2 s
        Attempt 3 → failure → wait ~4 s
        Attempt 4 → final failure → ai_status = 'failed'
    """
    asyncio.run(_run_ai_analysis(control_id, description))


# ── Celery Beat — daily compliance snapshot ────────────────────────────────────

@celery_app.task(name="app.tasks.ai_tasks.daily_compliance_snapshot")
def daily_compliance_snapshot() -> None:
    """
    Scheduled task (Celery Beat): snapshot compliance score for every org once/day.

    This guarantees the trend chart always has consistent daily data points even
    if no user logs in on a given day.

    The beat schedule is configured in celery_app.conf.beat_schedule.
    """
    asyncio.run(_snapshot_all_orgs())


async def _snapshot_all_orgs() -> None:
    from sqlalchemy.future import select
    from app.db.database import AsyncSessionLocal
    from app.models.organization import Organization
    from app.services.compliance_service import ComplianceService

    async with AsyncSessionLocal() as db:
        orgs = (await db.execute(select(Organization))).scalars().all()
        for org in orgs:
            try:
                await ComplianceService.take_snapshot(db, org.id)
                logger.info("Daily snapshot taken for org %s", org.id)
            except Exception as exc:
                logger.error("Snapshot failed for org %s: %s", org.id, exc)
