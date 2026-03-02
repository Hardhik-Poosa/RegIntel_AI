from __future__ import annotations
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.control import InternalControl
from app.models.compliance_snapshot import ComplianceSnapshot

logger = logging.getLogger(__name__)

# ── Scoring weights ───────────────────────────────────────────────────
RISK_WEIGHT = {"HIGH": 10, "MEDIUM": 5, "LOW": 2}
STATUS_MULT = {"IMPLEMENTED": 1.0, "PARTIAL": 0.5, "MISSING": 0.0}


def _control_weight(control: InternalControl) -> float:
    risk  = (control.risk_score.name if control.risk_score else "MEDIUM")
    return RISK_WEIGHT.get(risk, 5)


def _control_contribution(control: InternalControl) -> float:
    status = (control.status.name if control.status else "MISSING")
    return _control_weight(control) * STATUS_MULT.get(status, 0.0)


def _grade(score: int) -> str:
    if score >= 90: return "A+"
    if score >= 80: return "A"
    if score >= 70: return "B"
    if score >= 60: return "C"
    if score >= 40: return "D"
    return "F"


class ComplianceService:

    # ── Core weighted score (used everywhere) ──────────────────────────────
    @staticmethod
    async def calculate_score(
        db: AsyncSession,
        organization_id: UUID,
    ) -> int:
        stmt = select(InternalControl).where(
            InternalControl.organization_id == organization_id
        )
        controls = (await db.execute(stmt)).scalars().all()
        if not controls:
            return 0
        possible = sum(_control_weight(c) for c in controls)
        achieved = sum(_control_contribution(c) for c in controls)
        return int((achieved / possible) * 100) if possible else 0

    # ── Rich breakdown for Compliance page ──────────────────────────────
    @staticmethod
    async def calculate_score_detailed(
        db: AsyncSession,
        organization_id: UUID,
    ) -> dict:
        stmt = select(InternalControl).where(
            InternalControl.organization_id == organization_id
        )
        controls = (await db.execute(stmt)).scalars().all()

        if not controls:
            return {
                "compliance_score": 0, "grade": "F",
                "total_controls": 0,
                "by_status": {"IMPLEMENTED": 0, "PARTIAL": 0, "MISSING": 0},
                "by_risk": {
                    "HIGH":   {"total": 0, "implemented": 0, "partial": 0, "missing": 0, "weight": RISK_WEIGHT["HIGH"]},
                    "MEDIUM": {"total": 0, "implemented": 0, "partial": 0, "missing": 0, "weight": RISK_WEIGHT["MEDIUM"]},
                    "LOW":    {"total": 0, "implemented": 0, "partial": 0, "missing": 0, "weight": RISK_WEIGHT["LOW"]},
                },
                "high_risk_missing": 0,
                "max_score_gain": 0,
                "trend": [],
            }

        # By-status counts
        by_status = {"IMPLEMENTED": 0, "PARTIAL": 0, "MISSING": 0}
        for c in controls:
            s = c.status.name if c.status else "MISSING"
            by_status[s] = by_status.get(s, 0) + 1

        # By-risk matrix
        by_risk: dict = {
            k: {"total": 0, "implemented": 0, "partial": 0, "missing": 0, "weight": w}
            for k, w in RISK_WEIGHT.items()
        }
        for c in controls:
            r = c.risk_score.name if c.risk_score else "MEDIUM"
            s = c.status.name  if c.status   else "MISSING"
            by_risk[r]["total"]      += 1
            by_risk[r][s.lower()]    += 1

        # Score
        possible   = sum(_control_weight(c) for c in controls)
        achieved   = sum(_control_contribution(c) for c in controls)
        score      = int((achieved / possible) * 100) if possible else 0

        # Max gain: how many points could be gained if all MISSING became IMPLEMENTED
        max_gain = 0
        for c in controls:
            if (c.status.name if c.status else "MISSING") == "MISSING":
                max_gain += int(_control_weight(c) / possible * 100) if possible else 0

        high_risk_missing = by_risk["HIGH"]["missing"]

        # Trend (last 30 snapshots for this org)
        snap_stmt = (
            select(ComplianceSnapshot)
            .where(ComplianceSnapshot.organization_id == organization_id)
            .order_by(ComplianceSnapshot.created_at.desc())
            .limit(30)
        )
        snaps = (await db.execute(snap_stmt)).scalars().all()
        trend = [
            {"date": s.created_at.strftime("%Y-%m-%d %H:%M"), "score": s.score}
            for s in reversed(snaps)
        ]

        return {
            "compliance_score": score,
            "grade":            _grade(score),
            "total_controls":   len(controls),
            "by_status":        by_status,
            "by_risk":          by_risk,
            "high_risk_missing": high_risk_missing,
            "max_score_gain":   max_gain,
            "trend":            trend,
        }

    # ── Write updated score to controls + save snapshot ────────────────────
    @staticmethod
    async def update_control_scores(
        db: AsyncSession,
        organization_id: UUID,
    ) -> None:
        score = await ComplianceService.calculate_score(db, organization_id)

        stmt = select(InternalControl).where(
            InternalControl.organization_id == organization_id
        )
        controls = (await db.execute(stmt)).scalars().all()
        for control in controls:
            control.compliance_score = score

        # Save a snapshot for trend tracking
        snapshot = ComplianceSnapshot(organization_id=organization_id, score=score)
        db.add(snapshot)

        await db.commit()
        logger.debug("Compliance score updated: org=%s score=%d", organization_id, score)

    @staticmethod
    async def take_snapshot(db: AsyncSession, organization_id: UUID) -> int:
        """
        Calculate current compliance score and persist a snapshot row.
        Used by the Celery Beat daily_compliance_snapshot task.
        Returns the score.
        """
        score = await ComplianceService.calculate_score(db, organization_id)
        snapshot = ComplianceSnapshot(organization_id=organization_id, score=score)
        db.add(snapshot)
        await db.commit()
        return score
