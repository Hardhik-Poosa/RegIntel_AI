from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.schemas.control import ControlCreate, ControlUpdate, ControlResponse
from app.services.control_service import ControlService

router = APIRouter()


@router.post("/", response_model=ControlResponse, status_code=status.HTTP_201_CREATED)
async def create_control(
    control_in: ControlCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await ControlService.create(
        db=db,
        obj_in=control_in,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
    )


@router.get("/", response_model=List[ControlResponse])
async def read_controls(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await ControlService.get_multi(
        db=db,
        organization_id=current_user.organization_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{control_id}", response_model=ControlResponse)
async def read_control(
    control_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    control = await ControlService.get_by_id(
        db=db,
        control_id=control_id,
        organization_id=current_user.organization_id,
    )

    if not control:
        raise HTTPException(status_code=404, detail="Control not found")

    return control


@router.put("/{control_id}", response_model=ControlResponse)
async def update_control(
    control_id: UUID,
    control_in: ControlUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    control = await ControlService.get_by_id(
        db=db,
        control_id=control_id,
        organization_id=current_user.organization_id,
    )

    if not control:
        raise HTTPException(status_code=404, detail="Control not found")

    return await ControlService.update(
        db=db,
        db_obj=control,
        obj_in=control_in,
    )


@router.delete("/{control_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_control(
    control_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    control = await ControlService.get_by_id(
        db=db,
        control_id=control_id,
        organization_id=current_user.organization_id,
    )

    if not control:
        raise HTTPException(status_code=404, detail="Control not found")

    await ControlService.delete(db=db, db_obj=control)
