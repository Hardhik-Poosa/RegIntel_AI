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

