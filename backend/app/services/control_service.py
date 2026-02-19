from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from typing import List, Optional

from app.models.control import InternalControl
from app.schemas.control import ControlCreate, ControlUpdate


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
        return db_obj

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
    ) -> InternalControl:

        update_data = obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    @staticmethod
    async def delete(
        db: AsyncSession,
        *,
        db_obj: InternalControl,
    ) -> None:

        await db.delete(db_obj)
        await db.commit()
        