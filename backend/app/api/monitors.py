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
