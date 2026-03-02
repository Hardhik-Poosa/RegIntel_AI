"""
AI Compliance Copilot service.

Builds a rich context from the organisation's compliance data and sends
it to the LLM together with the user's question.  Keeps all AI calls
in one place; no hardcoded secrets.
"""
from __future__ import annotations

import json
import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.services.ai_service import AIService

logger = logging.getLogger(__name__)


class CopilotService:

    @staticmethod
    async def build_context(db: AsyncSession, organization_id: UUID) -> dict:
        """
        Fetch controls + recent snapshots and build a JSON-serialisable
        summary that the LLM can understand.
        """
        from app.models.control import InternalControl
        from app.models.compliance_snapshot import ComplianceSnapshot

        # Controls
        ctrl_result = await db.execute(
            select(InternalControl).where(InternalControl.organization_id == organization_id)
        )
        controls = ctrl_result.scalars().all()

        # Snapshots (latest 30)
        snap_result = await db.execute(
            select(ComplianceSnapshot)
            .where(ComplianceSnapshot.organization_id == organization_id)
            .order_by(ComplianceSnapshot.created_at.desc())
            .limit(30)
        )
        snapshots = snap_result.scalars().all()

        # Summarise controls
        controls_summary = [
            {
                "title":       c.title,
                "status":      c.status.value if hasattr(c.status, "value") else str(c.status),
                "risk":        c.risk_score.value if hasattr(c.risk_score, "value") else str(c.risk_score),
                "ai_category": c.ai_category,
                "ai_suggested_risk": c.ai_suggested_risk,
                "framework":   c.framework.name if c.framework else None,
            }
            for c in controls
        ]

        # Weighted score (same formula as compliance_service)
        RISK_W  = {"HIGH": 10, "MEDIUM": 5, "LOW": 2}
        STATUS_M = {"IMPLEMENTED": 1.0, "PARTIAL": 0.5, "MISSING": 0.0}

        def _status_str(c): return c.status.value if hasattr(c.status, "value") else str(c.status)
        def _risk_str(c):   return c.risk_score.value if hasattr(c.risk_score, "value") else str(c.risk_score)

        total_w  = sum(RISK_W.get(_risk_str(c), 5)  for c in controls)
        earned_w = sum(
            RISK_W.get(_risk_str(c), 5) * STATUS_M.get(_status_str(c), 0.0)
            for c in controls
        )
        score = round((earned_w / total_w) * 100) if total_w else 0

        high_missing = [
            c.title for c in controls
            if _risk_str(c) == "HIGH" and _status_str(c) == "MISSING"
        ]

        return {
            "compliance_score":   score,
            "total_controls":     len(controls),
            "high_risk_missing":  high_missing,
            "controls":           controls_summary,
            "recent_scores":      [s.score for s in reversed(snapshots)],
        }

    @staticmethod
    async def ask(db: AsyncSession, organization_id: UUID, question: str) -> str:
        """
        Answer a compliance question using full organisation context.
        """
        context = await CopilotService.build_context(db, organization_id)

        system_prompt = (
            "You are RegintelAI, an expert compliance intelligence assistant "
            "specialising in FinTech regulation (RBI, PCI-DSS, SOC 2) and "
            "AI governance (EU AI Act, NIST AI RMF). "
            "Provide clear, actionable recommendations. "
            "Always reference specific controls by name when relevant. "
            "Be concise but comprehensive. Format with bullet points."
        )

        user_prompt = f"""Organisation compliance context:
{json.dumps(context, indent=2)}

Question from the compliance team:
{question}

Answer with specific, actionable recommendations based only on the data above."""

        try:
            answer = await AIService.chat(user_prompt, system_prompt=system_prompt)
            return answer
        except Exception as exc:
            logger.error("Copilot chat failed: %s", exc)
            return (
                "I'm unable to process your question right now. "
                "Please check that the AI service is configured and try again."
            )
