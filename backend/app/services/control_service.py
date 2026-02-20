import asyncio
import logging
from uuid import UUID
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.control import InternalControl
from app.schemas.control import ControlCreate, ControlUpdate
from app.services.ai_service import AIService
from app.services.audit_service import AuditService

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

        db_obj = InternalControl(
            **obj_in.model_dump(),
            organization_id=organization_id,
            created_by_id=user_id,
        )

        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)

        logger.info(f"Control created: {db_obj.id}")

        # 🔹 Background AI execution
        if db_obj.description:
            asyncio.create_task(
                ControlService._background_ai_task(
                    db_obj.id, db_obj.description
                )
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

        return db_obj

    @staticmethod
    async def _background_ai_task(control_id: UUID, description: str):

        from app.db.database import async_session_maker

        async with async_session_maker() as db:
            try:
                analysis = await AIService.analyze_control(description)

                stmt = select(InternalControl).where(
                    InternalControl.id == control_id
                )
                result = await db.execute(stmt)
                control = result.scalars().first()

                if control:
                    control.ai_analysis = analysis
                    await db.commit()
                    logger.info(f"AI analysis saved for control {control_id}")

            except Exception as e:
                logger.error(f"AI background task failed: {e}")

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