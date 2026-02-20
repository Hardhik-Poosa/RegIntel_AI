from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.compliance_service import ComplianceService

router = APIRouter(prefix="/compliance", tags=["Compliance"])


@router.get("/score")
async def get_compliance_score(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):

    score = await ComplianceService.calculate_score(
        db=db,
        organization_id=current_user.organization_id,
    )

    return {
        "organization_id": str(current_user.organization_id),
        "compliance_score": score
    }