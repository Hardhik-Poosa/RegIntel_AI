from __future__ import annotations
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.security import get_current_active_user, get_password_hash
from app.db.database import get_db
from app.models.user import User, UserRole
from app.api.deps_rbac import require_roles

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Schemas (local — no separate schemas file needed) ─────────────────────────

class UserPublic(BaseModel):
    id: UUID
    email: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class InvitePayload(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.VIEWER


class RoleUpdate(BaseModel):
    role: UserRole


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/me")
async def read_current_user(
    current_user: User = Depends(get_current_active_user),
):
    return current_user


@router.get("/", response_model=list[UserPublic])
async def list_org_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER)
    ),
):
    """List all users in the current user's organisation."""
    result = await db.execute(
        select(User).where(User.organization_id == current_user.organization_id)
    )
    return result.scalars().all()


@router.post("/invite", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def invite_user(
    payload: InvitePayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Create a new user in the current organisation (admin only)."""
    existing = (
        await db.execute(select(User).where(User.email == payload.email))
    ).scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")

    new_user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        organization_id=current_user.organization_id,
        is_active=True,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    logger.info("Invited user %s to org %s", new_user.email, current_user.organization_id)
    return new_user


@router.patch("/{user_id}/role", response_model=UserPublic)
async def change_user_role(
    user_id: UUID,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Change a user's role (admin only, same organisation)."""
    user = (
        await db.execute(
            select(User).where(
                User.id == user_id,
                User.organization_id == current_user.organization_id,
            )
        )
    ).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role.")
    user.role = payload.role
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Deactivate a user (admin only, same organisation)."""
    user = (
        await db.execute(
            select(User).where(
                User.id == user_id,
                User.organization_id == current_user.organization_id,
            )
        )
    ).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself.")
    user.is_active = False
    await db.commit()
