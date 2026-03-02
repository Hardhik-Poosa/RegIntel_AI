"""
Vendor Risk Management API — full CRUD + risk summary
GET|POST /vendors/
GET|PUT|DELETE /vendors/{vendor_id}
GET /vendors/summary
"""
from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.vendor_service import VendorService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/vendors", tags=["Vendors"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class VendorCreate(BaseModel):
    name:        str
    category:    Optional[str] = None
    website:     Optional[str] = None
    description: Optional[str] = None
    notes:       Optional[str] = None


class VendorUpdate(BaseModel):
    name:          Optional[str] = None
    category:      Optional[str] = None
    website:       Optional[str] = None
    description:   Optional[str] = None
    notes:         Optional[str] = None
    risk_level:    Optional[str] = None
    review_status: Optional[str] = None


def _serialise(v) -> dict:
    return {
        "id":            str(v.id),
        "name":          v.name,
        "category":      v.category,
        "website":       v.website,
        "description":   v.description,
        "notes":         v.notes,
        "risk_level":    v.risk_level,
        "review_status": v.review_status,
        "created_at":    v.created_at.isoformat() if v.created_at else None,
        "updated_at":    v.updated_at.isoformat() if v.updated_at else None,
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/summary", summary="Vendor risk summary counts")
async def vendor_summary(
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(get_current_user),
) -> dict:
    return await VendorService.risk_summary(db, organization_id=user.organization_id)


@router.get("/", summary="List all vendors for the current organisation")
async def list_vendors(
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(get_current_user),
) -> list[dict]:
    vendors = await VendorService.list_all(db, organization_id=user.organization_id)
    return [_serialise(v) for v in vendors]


@router.post("/", status_code=status.HTTP_201_CREATED, summary="Add a new vendor")
async def create_vendor(
    payload: VendorCreate,
    db:      AsyncSession = Depends(get_db),
    user:    User         = Depends(get_current_user),
) -> dict:
    vendor = await VendorService.create(
        db,
        organization_id = user.organization_id,
        **payload.model_dump(),
    )
    return _serialise(vendor)


@router.get("/{vendor_id}", summary="Get a specific vendor")
async def get_vendor(
    vendor_id: UUID,
    db:        AsyncSession = Depends(get_db),
    user:      User         = Depends(get_current_user),
) -> dict:
    vendor = await VendorService.get_by_id(db, vendor_id=vendor_id, organization_id=user.organization_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return _serialise(vendor)


@router.put("/{vendor_id}", summary="Update a vendor")
async def update_vendor(
    vendor_id: UUID,
    payload:   VendorUpdate,
    db:        AsyncSession = Depends(get_db),
    user:      User         = Depends(get_current_user),
) -> dict:
    vendor = await VendorService.get_by_id(db, vendor_id=vendor_id, organization_id=user.organization_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    updated = await VendorService.update(db, vendor=vendor, **payload.model_dump(exclude_none=True))
    return _serialise(updated)


@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a vendor")
async def delete_vendor(
    vendor_id: UUID,
    db:        AsyncSession = Depends(get_db),
    user:      User         = Depends(get_current_user),
) -> None:
    vendor = await VendorService.get_by_id(db, vendor_id=vendor_id, organization_id=user.organization_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    await VendorService.delete(db, vendor=vendor)
