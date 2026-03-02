"""
Compliance Alert Service — create, list, and acknowledge alerts.
"""
from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.alert import ComplianceAlert

logger = logging.getLogger(__name__)


class AlertService:

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        organization_id: UUID,
        message: str,
        severity: str = "HIGH",
        category: str | None = None,
        control_id: UUID | None = None,
    ) -> ComplianceAlert:
        alert = ComplianceAlert(
            organization_id = organization_id,
            control_id      = control_id,
            severity        = severity,
            category        = category,
            message         = message,
            acknowledged    = False,
        )
        db.add(alert)
        await db.commit()
        await db.refresh(alert)
        logger.info("Alert created: %s [%s]", severity, message[:60])
        return alert

    @staticmethod
    async def list_all(
        db: AsyncSession,
        *,
        organization_id: UUID,
        unacknowledged_only: bool = False,
        limit: int = 100,
    ) -> list[ComplianceAlert]:
        stmt = (
            select(ComplianceAlert)
            .where(ComplianceAlert.organization_id == organization_id)
            .order_by(ComplianceAlert.created_at.desc())
            .limit(limit)
        )
        if unacknowledged_only:
            stmt = stmt.where(ComplianceAlert.acknowledged == False)      # noqa: E712
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, *, alert_id: UUID) -> Optional[ComplianceAlert]:
        result = await db.execute(select(ComplianceAlert).where(ComplianceAlert.id == alert_id))
        return result.scalars().first()

    @staticmethod
    async def acknowledge(db: AsyncSession, *, alert: ComplianceAlert) -> ComplianceAlert:
        alert.acknowledged = True
        await db.commit()
        await db.refresh(alert)
        return alert

    @staticmethod
    async def acknowledge_all(db: AsyncSession, *, organization_id: UUID) -> int:
        """Acknowledge all unacknowledged alerts. Returns count updated."""
        alerts = await AlertService.list_all(db, organization_id=organization_id, unacknowledged_only=True)
        for a in alerts:
            a.acknowledged = True
        await db.commit()
        return len(alerts)

    @staticmethod
    async def delete(db: AsyncSession, *, alert: ComplianceAlert) -> None:
        await db.delete(alert)
        await db.commit()

    @staticmethod
    async def summary(db: AsyncSession, *, organization_id: UUID) -> dict:
        alerts = await AlertService.list_all(db, organization_id=organization_id)
        return {
            "total":        len(alerts),
            "unacknowledged": sum(1 for a in alerts if not a.acknowledged),
            "critical":     sum(1 for a in alerts if a.severity == "CRITICAL"),
            "high":         sum(1 for a in alerts if a.severity == "HIGH"),
            "medium":       sum(1 for a in alerts if a.severity == "MEDIUM"),
        }
