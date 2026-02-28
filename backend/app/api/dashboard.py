from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.control import InternalControl, ControlRisk
from app.services.compliance_service import ComplianceService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/")
async def organization_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    stmt = select(InternalControl).where(
        InternalControl.organization_id == current_user.organization_id
    )
    controls = (await db.execute(stmt)).scalars().all()

    total       = len(controls)
    implemented = sum(1 for c in controls if c.status.name == "IMPLEMENTED")
    missing     = sum(1 for c in controls if c.status.name == "MISSING")
    partial     = sum(1 for c in controls if c.status.name == "PARTIAL")
    high_risk   = sum(1 for c in controls if (c.risk_score.name if c.risk_score else "") == "HIGH")

    compliance_score = await ComplianceService.calculate_score(
        db, current_user.organization_id,
    )

    return {
        "total_controls":  total,
        "implemented":     implemented,
        "partial":         partial,
        "missing":         missing,
        "high_risk":       high_risk,
        "compliance_score": compliance_score,
    }