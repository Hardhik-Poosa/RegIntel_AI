from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import get_db
from app.api.deps_rbac import require_roles
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.control import InternalControl
from app.models.audit import AuditLog

router = APIRouter()

# Admin-only dependency — returns current user if ADMIN, raises 403 otherwise
_admin_only = require_roles(UserRole.ADMIN)


@router.get("/stats")
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_admin_only),
):
    """Platform-wide statistics. ADMIN role required."""
    total_orgs     = (await db.execute(select(func.count()).select_from(Organization))).scalar_one()
    total_users    = (await db.execute(select(func.count()).select_from(User))).scalar_one()
    total_controls = (await db.execute(select(func.count()).select_from(InternalControl))).scalar_one()
    total_ai_calls = (await db.execute(
        select(func.count()).select_from(AuditLog).where(AuditLog.action == "AI_CHAT")
    )).scalar_one()
    total_audit    = (await db.execute(select(func.count()).select_from(AuditLog))).scalar_one()

    return {
        "total_organizations": total_orgs,
        "total_users":         total_users,
        "total_controls":      total_controls,
        "total_ai_calls":      total_ai_calls,
        "total_audit_logs":    total_audit,
    }
