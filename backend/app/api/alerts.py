"""
Compliance Alerts API — list, acknowledge, delete, summary
GET    /alerts/
GET    /alerts/summary
POST   /alerts/{id}/acknowledge
POST   /alerts/acknowledge-all
DELETE /alerts/{id}
"""
from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.alert_service import AlertService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/alerts", tags=["Alerts"])


def _serialise(a) -> dict:
    return {
        "id":           str(a.id),
        "severity":     a.severity,
        "category":     a.category,
        "message":      a.message,
        "acknowledged": a.acknowledged,
        "control_id":   str(a.control_id) if a.control_id else None,
        "created_at":   a.created_at.isoformat() if a.created_at else None,
    }


@router.get("/summary", summary="Alert count breakdown by severity")
async def alert_summary(
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(get_current_user),
) -> dict:
    return await AlertService.summary(db, organization_id=user.organization_id)


@router.get("/", summary="List compliance alerts")
async def list_alerts(
    unacked: bool       = Query(False, description="Only unacknowledged alerts"),
    limit:   int        = Query(100, ge=1, le=500),
    db:      AsyncSession = Depends(get_db),
    user:    User         = Depends(get_current_user),
) -> list[dict]:
    alerts = await AlertService.list_all(
        db,
        organization_id     = user.organization_id,
        unacknowledged_only = unacked,
        limit               = limit,
    )
    return [_serialise(a) for a in alerts]


@router.post("/{alert_id}/acknowledge", summary="Acknowledge a specific alert")
async def acknowledge_alert(
    alert_id: UUID,
    db:       AsyncSession = Depends(get_db),
    user:     User         = Depends(get_current_user),
) -> dict:
    alert = await AlertService.get_by_id(db, alert_id=alert_id)
    if not alert or alert.organization_id != user.organization_id:
        raise HTTPException(status_code=404, detail="Alert not found")
    updated = await AlertService.acknowledge(db, alert=alert)
    return _serialise(updated)


@router.post("/acknowledge-all", summary="Acknowledge all outstanding alerts")
async def acknowledge_all(
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(get_current_user),
) -> dict:
    count = await AlertService.acknowledge_all(db, organization_id=user.organization_id)
    return {"acknowledged": count}


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an alert")
async def delete_alert(
    alert_id: UUID,
    db:       AsyncSession = Depends(get_db),
    user:     User         = Depends(get_current_user),
) -> None:
    alert = await AlertService.get_by_id(db, alert_id=alert_id)
    if not alert or alert.organization_id != user.organization_id:
        raise HTTPException(status_code=404, detail="Alert not found")
    await AlertService.delete(db, alert=alert)
