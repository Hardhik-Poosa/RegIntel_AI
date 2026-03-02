"""
Compliance Frameworks API — list frameworks, filter by category.
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.db.database import get_db
from app.core.security import get_current_active_user
from app.services.framework_service import FrameworkService

router = APIRouter()


class FrameworkOut(BaseModel):
    id: UUID
    name: str
    category: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[FrameworkOut])
async def list_frameworks(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_active_user),
):
    """
    Return all compliance frameworks.
    Optionally filter by category:
      ?category=Financial
      ?category=AI+Governance
      ?category=Security
    """
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
