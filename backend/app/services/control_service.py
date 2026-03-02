import asyncio
import logging
from uuid import UUID
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.control import InternalControl
from app.models.organization import Organization
from app.schemas.control import ControlCreate, ControlUpdate
from app.services.ai_service import AIService
from app.services.audit_service import AuditService
from app.services.compliance_service import ComplianceService

logger = logging.getLogger(__name__)


class ControlService:

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        obj_in: ControlCreate,
        organization_id: UUID,
        user_id: UUID,
    ) -> InternalControl:

        # 🔹 Plan tier enforcement — check controls_limit
        org = await db.get(Organization, organization_id)
        count_result = await db.execute(
            select(func.count()).select_from(InternalControl)
            .where(InternalControl.organization_id == organization_id)
        )
        current_count = count_result.scalar() or 0
        limit = org.controls_limit if org else 50
        if current_count >= limit:
            raise HTTPException(
                status_code=403,
                detail=f"Control limit ({limit}) reached for your plan tier '{org.plan_tier if org else 'starter'}'. Upgrade to add more controls."
            )

        db_obj = InternalControl(
            **obj_in.model_dump(),
            organization_id=organization_id,
            created_by_id=user_id,
        )

        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)

        logger.info(f"Control created: {db_obj.id}")

        # 🔹 Background AI execution — Celery preferred, asyncio fallback
        if db_obj.description:
            try:
                from app.tasks.ai_tasks import run_ai_analysis
                run_ai_analysis.delay(str(db_obj.id), db_obj.description)
                logger.debug("Dispatched AI task via Celery for control %s", db_obj.id)
            except Exception as exc:  # Celery/Redis not available (dev without Redis)
                logger.warning("Celery unavailable (%s), falling back to asyncio", exc)
                asyncio.create_task(
                    ControlService._background_ai_task(db_obj.id, db_obj.description)
                )

        # 🔹 Audit log
        await AuditService.log(
            db=db,
            organization_id=organization_id,
            user_id=user_id,
            action="CREATE",
            entity_type="CONTROL",
            entity_id=db_obj.id,
            details=f"Created control {db_obj.title}",
        )
        
        await ComplianceService.update_control_scores(
            db,
            organization_id,
        )

        await db.refresh(db_obj)
        return db_obj

    @staticmethod
    async def _background_ai_task(control_id: UUID, description: str):
        """
        asyncio fallback — delegates to the same implementation used by the Celery task.
        This ensures ai_status lifecycle (pending → processing → done/failed) is consistent
        whether we're running with Redis+Celery or plain asyncio in local dev.
        """
        from app.tasks.ai_tasks import _run_ai_analysis
        await _run_ai_analysis(str(control_id), description)

    @staticmethod
    async def get_multi(
        db: AsyncSession,
        *,
        organization_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[InternalControl]:

        stmt = (
            select(InternalControl)
            .where(InternalControl.organization_id == organization_id)
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        *,
        control_id: UUID,
        organization_id: UUID,
    ) -> Optional[InternalControl]:

        stmt = select(InternalControl).where(
            InternalControl.id == control_id,
            InternalControl.organization_id == organization_id,
        )

        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def update(
        db: AsyncSession,
        *,
        db_obj: InternalControl,
        obj_in: ControlUpdate,
        user_id: UUID,
    ) -> InternalControl:

        update_data = obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        await db.commit()
        await db.refresh(db_obj)

        logger.info(f"Control updated: {db_obj.id}")

        await AuditService.log(
            db=db,
            organization_id=db_obj.organization_id,
            user_id=user_id,
            action="UPDATE",
            entity_type="CONTROL",
            entity_id=db_obj.id,
            details="Updated control",
        )

        await ComplianceService.update_control_scores(
            db,
            db_obj.organization_id,
        )

        await db.refresh(db_obj)
        return db_obj

    @staticmethod
    async def delete(
        db: AsyncSession,
        *,
        db_obj: InternalControl,
        user_id: UUID,
    ) -> None:

        await AuditService.log(
            db=db,
            organization_id=db_obj.organization_id,
            user_id=user_id,
            action="DELETE",
            entity_type="CONTROL",
            entity_id=db_obj.id,
            details="Deleted control",
        )

        await db.delete(db_obj)
        await db.commit()

        logger.warning(f"Control deleted: {db_obj.id}")