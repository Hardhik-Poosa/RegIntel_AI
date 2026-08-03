"""
Compliance Monitoring API — POST /monitors/run-*, GET /monitors/
"""
from __future__ import annotations

import logging
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.monitor_service import MonitorService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/monitors", tags=["Monitors"])


# ── Request schemas ────────────────────────────────────────────────────────────

class GitHubCheckRequest(BaseModel):
    repo:       str
    token:      Optional[str] = None
    control_id: Optional[UUID] = None


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/run-github", summary="Run a GitHub repository compliance check")
async def run_github_check(
    payload: GitHubCheckRequest,
    db:      AsyncSession   = Depends(get_db),
    user:    User           = Depends(get_current_user),
) -> dict[str, Any]:
    issues = await MonitorService.run_github_check(
        db,
        organization_id = user.organization_id,
        repo            = payload.repo,
        token           = payload.token,
        control_id      = payload.control_id,
    )
    return {
        "status": "PASS" if not issues else "FAIL",
        "issues": issues,
        "repo":   payload.repo,
    }


@router.post("/run-control-gaps", summary="Scan for HIGH-risk MISSING controls")
async def run_control_gap_check(
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(get_current_user),
) -> dict[str, Any]:
    gaps = await MonitorService.run_control_gap_check(db, organization_id=user.organization_id)
    return {
        "status": "PASS" if not gaps else "FAIL",
        "gaps":   gaps,
    }


@router.post("/run-evidence-gaps", summary="Scan for IMPLEMENTED controls with no evidence")
async def run_evidence_gap_check(
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(get_current_user),
) -> dict[str, Any]:
    gaps = await MonitorService.run_evidence_gap_check(db, organization_id=user.organization_id)
    return {
        "status": "PASS" if not gaps else "WARNING",
        "gaps":   gaps,
    }


@router.post("/run-aws", summary="Run automated AWS cloud posture scan")
async def run_aws_check(
    control_id: Optional[UUID] = Query(None),
    db:         AsyncSession   = Depends(get_db),
    user:       User           = Depends(get_current_user),
) -> dict[str, Any]:
    checks = await MonitorService.run_aws_check(db, organization_id=user.organization_id, control_id=control_id)
    has_fails = any(c.get("status") == "FAIL" for c in checks)
    return {
        "status": "FAIL" if has_fails else "PASS",
        "checks": checks,
    }


@router.post("/run-evidence-expiration", summary="Scan for expiring or expired evidence")
async def run_evidence_expiration_check(
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(get_current_user),
) -> dict[str, Any]:
    expiring = await MonitorService.run_evidence_expiration_check(db, organization_id=user.organization_id)
    has_expired = any(e.get("is_expired") for e in expiring)
    return {
        "status": "FAIL" if has_expired else ("WARNING" if expiring else "PASS"),
        "expiring_documents": expiring,
    }


@router.post("/recalculate-posture", summary="Recalculate organizational control posture percentage")
async def recalculate_posture(
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(get_current_user),
) -> dict[str, Any]:
    summary = await MonitorService.recalculate_control_posture(db, organization_id=user.organization_id)
    return {
        "status": "SUCCESS",
        "summary": summary,
    }


@router.get("/jobs", summary="List continuous monitoring execution jobs")
async def list_jobs(
    limit: int         = Query(20, ge=1, le=100),
    db:    AsyncSession = Depends(get_db),
    user:  User         = Depends(get_current_user),
) -> list[dict]:
    jobs = await MonitorService.list_jobs(db, organization_id=user.organization_id, limit=limit)

    def _job_row(j) -> dict:
        return {
            "id":             str(j.id),
            "trigger_type":   j.trigger_type,
            "status":         j.status,
            "total_checks":   j.total_checks,
            "passed_checks":  j.passed_checks,
            "failed_checks":  j.failed_checks,
            "error_log":      j.error_log,
            "started_at":     j.started_at.isoformat() if j.started_at else None,
            "completed_at":   j.completed_at.isoformat() if j.completed_at else None,
            "created_at":     j.created_at.isoformat() if j.created_at else None,
        }

    return [_job_row(j) for j in jobs]


@router.post("/run", summary="Manual scan trigger — Run continuous compliance scan now")
@router.post("/run-all", summary="Run full manual compliance monitoring suite immediately")
async def run_full_suite(
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(get_current_user),
) -> dict[str, Any]:
    return await MonitorService.run_full_monitoring_suite(db, organization_id=user.organization_id, trigger_type="MANUAL")


@router.get("/statistics", summary="Get continuous compliance scan statistics")
async def get_statistics(
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(get_current_user),
) -> dict[str, Any]:
    return await MonitorService.get_statistics(db, organization_id=user.organization_id)


@router.get("/alerts", summary="List active and resolved compliance alerts")
async def list_alerts(
    limit: int         = Query(50, ge=1, le=200),
    db:    AsyncSession = Depends(get_db),
    user:  User         = Depends(get_current_user),
) -> list[dict]:
    from app.services.alert_service import AlertService
    alerts = await AlertService.get_alerts_for_org(db, organization_id=user.organization_id, limit=limit)
    return [
        {
            "id":           str(a.id),
            "title":        a.title or f"Alert: {a.category or 'MONITOR'}",
            "description":  a.description or a.message,
            "message":      a.message,
            "severity":     a.severity,
            "category":     a.category,
            "status":       a.status,
            "assigned_to":   str(a.assigned_to) if a.assigned_to else None,
            "resolved_at":  a.resolved_at,
            "created_at":   a.created_at.isoformat() if a.created_at else None,
        }
        for a in alerts
    ]


@router.get("/health", summary="Get System Health Dashboard & operational metrics")
async def get_health(
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(get_current_user),
) -> dict[str, Any]:
    return await MonitorService.get_health_dashboard(db, organization_id=user.organization_id)


@router.get("/changes", summary="List detected compliance state changes & deltas")
async def list_changes(
    limit: int         = Query(50, ge=1, le=200),
    db:    AsyncSession = Depends(get_db),
    user:  User         = Depends(get_current_user),
) -> list[dict]:
    changes = await MonitorService.list_changes(db, organization_id=user.organization_id, limit=limit)
    return [
        {
            "id":          str(c.id),
            "control_id":  str(c.control_id) if c.control_id else None,
            "change_type": c.change_type,
            "old_value":   c.old_value,
            "new_value":   c.new_value,
            "severity":    c.severity,
            "reason":      getattr(c, "reason", None) or f"Change in {c.change_type}",
            "resolved":    getattr(c, "resolved", False),
            "detected_at": c.detected_at.isoformat() if getattr(c, "detected_at", None) else (c.created_at.isoformat() if c.created_at else None),
            "created_at":  c.created_at.isoformat() if c.created_at else None,
        }
        for c in changes
    ]


@router.get("/assets", summary="List cloud asset inventory & risk ratings")
async def list_assets(
    limit: int         = Query(100, ge=1, le=500),
    db:    AsyncSession = Depends(get_db),
    user:  User         = Depends(get_current_user),
) -> list[dict]:
    assets = await MonitorService.list_assets(db, organization_id=user.organization_id, limit=limit)
    return [
        {
            "id":          str(a.id),
            "provider":    a.provider,
            "asset_type":  a.asset_type,
            "name":        a.name,
            "owner":       a.owner,
            "risk_level":  a.risk_level,
            "last_seen":   a.last_seen.isoformat() if a.last_seen else None,
        }
        for a in assets
    ]


@router.get("/rules", summary="List configurable monitoring rules")
async def list_rules(
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(get_current_user),
) -> list[dict]:
    rules = await MonitorService.list_rules(db, organization_id=user.organization_id)
    return [
        {
            "id":             str(r.id),
            "provider":       getattr(r, "provider", "AWS"),
            "rule_name":      r.rule_name,
            "condition_type": r.condition_type,
            "severity":       r.severity,
            "enabled":        r.enabled,
            "description":    r.description,
            "last_run":       getattr(r, "last_run", None) or "Recently",
        }
        for r in rules
    ]


class CreateRulePayload(BaseModel):
    provider:       Optional[str] = "AWS"
    rule_name:      str
    condition_type: Optional[str] = "CUSTOM_CHECK"
    severity:       Optional[str] = "HIGH"
    enabled:        Optional[bool] = True
    description:    Optional[str] = ""


@router.post("/rules", summary="Create a configurable monitoring rule")
async def create_rule(
    payload: CreateRulePayload,
    db:      AsyncSession = Depends(get_db),
    user:    User         = Depends(get_current_user),
) -> dict:
    return await MonitorService.create_rule(db, organization_id=user.organization_id, payload=payload.dict())


@router.post("/rules/{rule_id}/toggle", summary="Toggle a monitoring rule enabled state")
async def toggle_rule(
    rule_id: UUID,
    db:      AsyncSession = Depends(get_db),
    user:    User         = Depends(get_current_user),
) -> dict:
    res = await MonitorService.toggle_rule(db, organization_id=user.organization_id, rule_id=rule_id)
    if not res:
        raise HTTPException(status_code=404, detail="Monitoring rule not found")
    return res


@router.get("/scans", summary="List historical compliance scan logs")
async def list_scans(
    limit: int         = Query(50, ge=1, le=200),
    db:    AsyncSession = Depends(get_db),
    user:  User         = Depends(get_current_user),
) -> list[dict]:
    scans = await MonitorService.list_scans(db, organization_id=user.organization_id, limit=limit)
    return [
        {
            "id":               str(s.id),
            "scan_type":        s.scan_type,
            "status":           s.status,
            "items_scanned":    getattr(s, "assets_scanned", 0) or s.items_scanned,
            "assets_scanned":   getattr(s, "assets_scanned", 0) or s.items_scanned,
            "failures_found":   s.failures_found,
            "errors":           getattr(s, "errors", 0) or s.failures_found,
            "duration_seconds": s.duration_seconds,
            "started_at":       s.started_at.isoformat() if s.started_at else None,
            "completed_at":     s.completed_at.isoformat() if s.completed_at else None,
            "finished_at":      s.completed_at.isoformat() if s.completed_at else None,
        }
        for s in scans
    ]


@router.get("/timeline", summary="Get activity timeline feed")
async def get_timeline(
    limit: int         = Query(30, ge=1, le=100),
    db:    AsyncSession = Depends(get_db),
    user:  User         = Depends(get_current_user),
) -> list[dict]:
    return await MonitorService.get_timeline(db, organization_id=user.organization_id, limit=limit)


@router.get("/", summary="List monitoring history for the current organisation")
async def list_history(
    limit: int         = Query(50, ge=1, le=200),
    db:    AsyncSession = Depends(get_db),
    user:  User         = Depends(get_current_user),
) -> list[dict]:
    records = await MonitorService.list_history(db, organization_id=user.organization_id, limit=limit)

    def _row(m) -> dict:
        return {
            "id":          str(m.id),
            "check_type":  m.check_type,
            "status":      m.status,
            "message":     m.message,
            "control_id":  str(m.control_id) if m.control_id else None,
            "created_at":  m.created_at.isoformat() if m.created_at else None,
        }

    return [_row(r) for r in records]



