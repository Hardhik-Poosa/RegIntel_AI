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
    """Query all active organisations, create a ComplianceJob, and run every available check."""
    from app.db.database import AsyncSessionLocal
    from app.models.organization import Organization
    from app.services.monitor_service import MonitorService
    from sqlalchemy.future import select

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Organization))
        orgs = result.scalars().all()

        for org in orgs:
            oid = org.id
            logger.info("Starting monitoring run for org %s", oid)
            job_id = await MonitorService.create_job(db, organization_id=oid, trigger_type="NIGHTLY_CRON")
            total = 4
            passed = 0
            failed = 0
            errors = []

            # 1. Control Gap Check
            try:
                gaps = await MonitorService.run_control_gap_check(db, organization_id=oid)
                if not gaps:
                    passed += 1
                else:
                    failed += 1
            except Exception as exc:
                failed += 1
                errors.append(f"Control Gap Check: {exc}")

            # 2. Evidence Gap Check
            try:
                ev_gaps = await MonitorService.run_evidence_gap_check(db, organization_id=oid)
                if not ev_gaps:
                    passed += 1
                else:
                    failed += 1
            except Exception as exc:
                failed += 1
                errors.append(f"Evidence Gap Check: {exc}")

            # 3. AWS Security Check
            try:
                aws = await MonitorService.run_aws_check(db, organization_id=oid)
                if not any(a.get("status") == "FAIL" for a in aws):
                    passed += 1
                else:
                    failed += 1
            except Exception as exc:
                failed += 1
                errors.append(f"AWS Check: {exc}")

            # 4. Evidence Expiration Check
            try:
                exp = await MonitorService.run_evidence_expiration_check(db, organization_id=oid)
                if not any(e.get("is_expired") for e in exp):
                    passed += 1
                else:
                    failed += 1
            except Exception as exc:
                failed += 1
                errors.append(f"Evidence Expiration Check: {exc}")

            # 5. Control Posture Recalculation
            try:
                await MonitorService.recalculate_control_posture(db, organization_id=oid)
            except Exception as exc:
                logger.error("Posture recalculation failed for org %s: %s", oid, exc)

            job_status = "COMPLETED" if failed == 0 else "FAILED"
            err_msg = "; ".join(errors) if errors else None
            await MonitorService.update_job(
                db,
                job_id        = job_id,
                status        = job_status,
                total_checks  = total,
                passed_checks = passed,
                failed_checks = failed,
                error_log     = err_msg,
            )


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

