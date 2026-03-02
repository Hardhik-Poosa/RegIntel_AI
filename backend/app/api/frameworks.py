"""
Compliance Frameworks API — list frameworks, filter by category,
list template controls, and install a framework into an organisation's workspace.
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from app.db.database import get_db
from app.core.security import get_current_active_user
from app.services.framework_service import FrameworkService
from app.models.framework_control import FrameworkControl
from app.models.control import InternalControl

router = APIRouter()


class FrameworkOut(BaseModel):
    id: UUID
    name: str
    category: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class FrameworkControlOut(BaseModel):
    id:          UUID
    title:       str
    description: Optional[str] = None
    risk_score:  str
    status_hint: Optional[str] = None
    control_ref: Optional[str] = None

    class Config:
        from_attributes = True


class InstallResult(BaseModel):
    installed: int
    skipped:   int   # already existing controls with same title were skipped


@router.get("/", response_model=List[FrameworkOut])
async def list_frameworks(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_active_user),
):
    if category:
        return await FrameworkService.get_by_category(db, category)
    return await FrameworkService.list_all(db)


@router.get("/{framework_id}", response_model=FrameworkOut)
async def get_framework(
    framework_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_active_user),
):
    fw = await FrameworkService.get_by_id(db, framework_id)
    if not fw:
        raise HTTPException(status_code=404, detail="Framework not found")
    return fw


@router.get("/{framework_id}/controls", response_model=List[FrameworkControlOut])
async def list_framework_controls(
    framework_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_active_user),
):
    """Return the pre-built template controls for a framework."""
    result = await db.execute(
        select(FrameworkControl)
        .where(FrameworkControl.framework_id == framework_id)
        .order_by(FrameworkControl.control_ref)
    )
    return result.scalars().all()


@router.post("/{framework_id}/install", response_model=InstallResult, status_code=status.HTTP_201_CREATED)
async def install_framework(
    framework_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """
    Install all template controls from the framework into the current
    organisation's workspace.  Controls whose title already exists are skipped
    (idempotent).
    """
    fw = await FrameworkService.get_by_id(db, framework_id)
    if not fw:
        raise HTTPException(status_code=404, detail="Framework not found")

    templates_result = await db.execute(
        select(FrameworkControl).where(FrameworkControl.framework_id == framework_id)
    )
    templates = templates_result.scalars().all()
    if not templates:
        raise HTTPException(status_code=404, detail="No template controls found for this framework.")

    organization_id = current_user.organization_id

    # Fetch existing control titles to avoid duplicates
    existing_result = await db.execute(
        select(InternalControl.title)
        .where(InternalControl.organization_id == organization_id)
    )
    existing_titles = {r[0].lower() for r in existing_result.all()}

    installed = 0
    skipped   = 0

    for tmpl in templates:
        if tmpl.title.lower() in existing_titles:
            skipped += 1
            continue

        new_ctrl = InternalControl(
            organization_id = organization_id,
            created_by_id   = current_user.id,
            title           = f"[{fw.name}] {tmpl.title}",
            description     = tmpl.description or "",
            status          = "MISSING",
            risk_score      = tmpl.risk_score or "MEDIUM",
            framework_id    = framework_id,
            ai_status       = "pending",
        )
        db.add(new_ctrl)
        installed += 1

    await db.commit()
    return InstallResult(installed=installed, skipped=skipped)
