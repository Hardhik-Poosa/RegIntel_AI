"""
Vendor Risk Management Service.

Provides CRUD for Vendor records and risk calculation logic.
Risk level is derived from vendor category and review status.
"""
from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.vendor import Vendor

logger = logging.getLogger(__name__)

# Categories considered HIGH risk by default
HIGH_RISK_CATEGORIES = {"payment", "payments", "infrastructure", "banking", "financial data", "core banking"}
MEDIUM_RISK_CATEGORIES = {"saas", "cloud", "analytics", "crm", "erp", "communication"}


def _derive_risk(category: str | None) -> str:
    if not category:
        return "MEDIUM"
    cat_lower = category.lower()
    if any(h in cat_lower for h in HIGH_RISK_CATEGORIES):
        return "HIGH"
    if any(m in cat_lower for m in MEDIUM_RISK_CATEGORIES):
        return "MEDIUM"
    return "LOW"


class VendorService:

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        organization_id: UUID,
        name: str,
        category: str | None = None,
        website: str | None = None,
        description: str | None = None,
        notes: str | None = None,
    ) -> Vendor:
        risk = _derive_risk(category)
        vendor = Vendor(
            organization_id = organization_id,
            name            = name,
            category        = category,
            website         = website,
            description     = description,
            notes           = notes,
            risk_level      = risk,
            review_status   = "PENDING",
        )
        db.add(vendor)
        await db.commit()
        await db.refresh(vendor)
        logger.info("Vendor created: %s (risk=%s)", vendor.name, vendor.risk_level)
        return vendor

    @staticmethod
    async def list_all(db: AsyncSession, *, organization_id: UUID) -> list[Vendor]:
        result = await db.execute(
            select(Vendor)
            .where(Vendor.organization_id == organization_id)
            .order_by(Vendor.risk_level, Vendor.name)
        )
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, *, vendor_id: UUID, organization_id: UUID) -> Optional[Vendor]:
        result = await db.execute(
            select(Vendor).where(
                Vendor.id == vendor_id,
                Vendor.organization_id == organization_id,
            )
        )
        return result.scalars().first()

    @staticmethod
    async def update(db: AsyncSession, *, vendor: Vendor, **fields) -> Vendor:
        for k, v in fields.items():
            if hasattr(vendor, k) and v is not None:
                setattr(vendor, k, v)
        # Recalculate risk if category changed
        if "category" in fields:
            vendor.risk_level = _derive_risk(fields["category"])
        await db.commit()
        await db.refresh(vendor)
        return vendor

    @staticmethod
    async def delete(db: AsyncSession, *, vendor: Vendor) -> None:
        await db.delete(vendor)
        await db.commit()

    @staticmethod
    async def risk_summary(db: AsyncSession, *, organization_id: UUID) -> dict:
        vendors = await VendorService.list_all(db, organization_id=organization_id)
        return {
            "total":  len(vendors),
            "high":   sum(1 for v in vendors if v.risk_level == "HIGH"),
            "medium": sum(1 for v in vendors if v.risk_level == "MEDIUM"),
            "low":    sum(1 for v in vendors if v.risk_level == "LOW"),
            "pending_review": sum(1 for v in vendors if v.review_status == "PENDING"),
        }
