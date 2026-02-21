from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.control import InternalControl
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

    result = await db.execute(stmt)
    controls = result.scalars().all()

    total = len(controls)
    implemented = len([c for c in controls if c.status.name == "IMPLEMENTED"])
    missing = len([c for c in controls if c.status.name == "MISSING"])
    partial = len([c for c in controls if c.status.name == "PARTIAL"])

    compliance_score = await ComplianceService.calculate_score(
        db,
        current_user.organization_id,
    )

    return {
        "total_controls": total,
        "implemented": implemented,
        "partial": partial,
        "missing": missing,
        "compliance_score": compliance_score,
    }