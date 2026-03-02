"""
Risk Forecast API.

GET /api/v1/risk/forecast — potential gain + trend prediction
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.control import InternalControl
from app.models.compliance_snapshot import ComplianceSnapshot
from app.services.risk_service import RiskForecastService

router = APIRouter()


@router.get("/forecast")
async def get_risk_forecast(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns:
    - potential_gain: how many points could be gained by fixing MISSING controls
    - priority_fixes: ranked list of controls to fix (biggest score impact first)
    - trend: improving | stable | declining | insufficient_data
    - risk_warning: text warning about HIGH-risk missing controls
    """
    org_id = current_user.organization_id

    controls = (
        await db.execute(
            select(InternalControl).where(InternalControl.organization_id == org_id)
        )
    ).scalars().all()

    snapshots = (
        await db.execute(
            select(ComplianceSnapshot)
            .where(ComplianceSnapshot.organization_id == org_id)
            .order_by(ComplianceSnapshot.created_at.asc())
        )
    ).scalars().all()

    gain_data  = RiskForecastService.potential_gain(controls)
    trend_data = RiskForecastService.predict_trend(snapshots, controls)

    return {**gain_data, **trend_data}
