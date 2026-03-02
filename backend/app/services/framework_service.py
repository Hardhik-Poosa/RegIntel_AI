"""
Framework service — CRUD operations for ComplianceFramework.
"""
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.framework import ComplianceFramework


class FrameworkService:

    @staticmethod
    async def list_all(db: AsyncSession) -> List[ComplianceFramework]:
        """Return all compliance frameworks (global, not org-scoped)."""
        result = await db.execute(
            select(ComplianceFramework).order_by(ComplianceFramework.category, ComplianceFramework.name)
        )
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, framework_id: UUID) -> Optional[ComplianceFramework]:
        return await db.get(ComplianceFramework, framework_id)

    @staticmethod
    async def get_by_category(db: AsyncSession, category: str) -> List[ComplianceFramework]:
        result = await db.execute(
            select(ComplianceFramework).where(ComplianceFramework.category == category)
        )
        return result.scalars().all()
