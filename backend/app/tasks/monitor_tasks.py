"""
Celery tasks for the Continuous Compliance Monitoring Engine.

Tasks:
  run_daily_monitoring — runs control-gap and evidence-gap checks for all orgs
"""
from __future__ import annotations

import asyncio
import logging

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


async def _run_for_all_orgs() -> None:
    """Query all active organisations and run every available check."""
    from app.db.database import AsyncSessionLocal
    from app.models.organization import Organization
    from app.services.monitor_service import MonitorService
    from sqlalchemy.future import select

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Organization))
        orgs = result.scalars().all()

        for org in orgs:
            oid = org.id
            logger.info("Running monitoring checks for org %s", oid)
            try:
                await MonitorService.run_control_gap_check(db, organization_id=oid)
            except Exception as exc:
                logger.error("Control-gap check failed for org %s: %s", oid, exc)
            try:
                await MonitorService.run_evidence_gap_check(db, organization_id=oid)
            except Exception as exc:
                logger.error("Evidence-gap check failed for org %s: %s", oid, exc)


@celery_app.task(name="app.tasks.monitor_tasks.run_daily_monitoring", bind=True, max_retries=2)
def run_daily_monitoring(self) -> dict:   # type: ignore[override]
    """
    Celery beat task — runs at 03:00 UTC every day.
    Executes compliance checks across all organisations and stores results.
    """
    logger.info("Starting daily compliance monitoring run")
    try:
        asyncio.run(_run_for_all_orgs())
        logger.info("Daily compliance monitoring completed successfully")
        return {"status": "ok"}
    except Exception as exc:
        logger.error("Daily monitoring task failed: %s", exc)
        raise self.retry(exc=exc, countdown=300)
