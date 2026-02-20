from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.database import get_db
from app.models.audit import AuditLog
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/", response_model=List[dict])
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):

    stmt = select(AuditLog).where(
        AuditLog.organization_id == current_user.organization_id
    )

    result = await db.execute(stmt)
    logs = result.scalars().all()

    return logs