"""
Compliance Monitor Service.

Runs automated compliance checks and writes ComplianceMonitor results.
Also creates ComplianceAlerts when checks fail.

Supported check types:
  - GITHUB   → repository compliance signals (SECURITY.md, CODEOWNERS, etc.)
  - CONTROLS → internal control gap analysis (HIGH-risk MISSING controls)
  - EVIDENCE → controls with no uploaded evidence
"""
from __future__ import annotations

import json
import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

logger = logging.getLogger(__name__)


class MonitorService:

    # ── GitHub repository check ────────────────────────────────────────────────

    @staticmethod
    async def run_github_check(
        db: AsyncSession,
        organization_id: UUID,
        repo: str,
        token: str | None = None,
        control_id: UUID | None = None,
    ) -> list[dict]:
        """
        Run a full GitHub compliance check and persist results.
        Returns list of issue dicts.
        """
        from app.services.integrations.github_service import GitHubIntegrationService
        from app.models.compliance_monitor import ComplianceMonitor
        from app.services.alert_service import AlertService

        result = await GitHubIntegrationService.scan_repo(repo, token)

        issues = []
        for check_name, val in result["checks"].items():
            if not val.get("found"):
                issues.append(check_name.replace("_", " ").title())

        status  = "PASS" if not issues else "FAIL"
        message = "All GitHub compliance checks passed." if not issues else f"Issues: {', '.join(issues)}"

        monitor = ComplianceMonitor(
            organization_id = organization_id,
            control_id      = control_id,
            check_type      = "GITHUB",
            status          = status,
            message         = message,
            details         = json.dumps(result),
        )
        db.add(monitor)
        await db.commit()

        if issues:
            for issue in issues:
                await AlertService.create(
                    db,
                    organization_id = organization_id,
                    control_id      = control_id,
                    severity        = "HIGH",
                    category        = "MONITOR",
                    message         = f"GitHub check failed: {issue} in repo '{repo}'",
                )

        return issues

    # ── Internal control gap checks ────────────────────────────────────────────

    @staticmethod
    async def run_control_gap_check(db: AsyncSession, organization_id: UUID) -> list[dict]:
        """
        Scan all controls for HIGH-risk MISSING ones and fire alerts.
        Returns list of affected controls.
        """
        from app.models.control import InternalControl
        from app.models.compliance_monitor import ComplianceMonitor
        from app.services.alert_service import AlertService

        result = await db.execute(
            select(InternalControl).where(InternalControl.organization_id == organization_id)
        )
        controls = result.scalars().all()

        def status_str(c): return c.status.value if hasattr(c.status, "value") else str(c.status)
        def risk_str(c): return c.risk_score.value if hasattr(c.risk_score, "value") else str(c.risk_score)

        gaps = [c for c in controls if risk_str(c) == "HIGH" and status_str(c) == "MISSING"]

        status  = "PASS" if not gaps else "FAIL"
        message = (
            "No high-risk gaps detected." if not gaps
            else f"{len(gaps)} HIGH-risk control(s) still MISSING"
        )

        monitor = ComplianceMonitor(
            organization_id = organization_id,
            check_type      = "CONTROLS",
            status          = status,
            message         = message,
        )
        db.add(monitor)
        await db.commit()

        for c in gaps:
            await AlertService.create(
                db,
                organization_id = organization_id,
                control_id      = c.id,
                severity        = "HIGH",
                category        = "MONITOR",
                message         = f"HIGH-risk control '{c.title}' is still MISSING",
            )

        return [{"id": str(c.id), "title": c.title} for c in gaps]

    # ── Evidence gap checks ────────────────────────────────────────────────────

    @staticmethod
    async def run_evidence_gap_check(db: AsyncSession, organization_id: UUID) -> list[dict]:
        """Flag IMPLEMENTED controls that have zero evidence uploads."""
        from app.models.control import InternalControl
        from app.models.evidence import ControlEvidence
        from app.models.compliance_monitor import ComplianceMonitor
        from app.services.alert_service import AlertService

        ctrl_result = await db.execute(
            select(InternalControl).where(InternalControl.organization_id == organization_id)
        )
        controls = ctrl_result.scalars().all()

        no_evidence = []
        for c in controls:
            def status_str(ctrl): return ctrl.status.value if hasattr(ctrl.status, "value") else str(ctrl.status)
            if status_str(c) == "IMPLEMENTED":
                ev_result = await db.execute(
                    select(ControlEvidence).where(ControlEvidence.control_id == c.id).limit(1)
                )
                if not ev_result.scalars().first():
                    no_evidence.append(c)

        status  = "PASS" if not no_evidence else "WARNING"
        message = (
            "All implemented controls have evidence." if not no_evidence
            else f"{len(no_evidence)} implemented control(s) have no evidence"
        )

        monitor = ComplianceMonitor(
            organization_id = organization_id,
            check_type      = "EVIDENCE",
            status          = status,
            message         = message,
        )
        db.add(monitor)
        await db.commit()

        for c in no_evidence:
            await AlertService.create(
                db,
                organization_id = organization_id,
                control_id      = c.id,
                severity        = "MEDIUM",
                category        = "EVIDENCE",
                message         = f"Implemented control '{c.title}' has no evidence uploaded",
            )

        return [{"id": str(c.id), "title": c.title} for c in no_evidence]

    # ── History listing ────────────────────────────────────────────────────────

    @staticmethod
    async def list_history(db: AsyncSession, organization_id: UUID, limit: int = 50) -> list:
        from app.models.compliance_monitor import ComplianceMonitor
        result = await db.execute(
            select(ComplianceMonitor)
            .where(ComplianceMonitor.organization_id == organization_id)
            .order_by(ComplianceMonitor.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()
