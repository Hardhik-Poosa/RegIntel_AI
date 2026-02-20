from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from app.models.control import InternalControl


class ComplianceService:

    @staticmethod
    async def calculate_score(
        db: AsyncSession,
        organization_id: UUID,
    ) -> int:

        stmt = select(InternalControl).where(
            InternalControl.organization_id == organization_id
        )

        result = await db.execute(stmt)
        controls = result.scalars().all()

        if not controls:
            return 0

        implemented_count = 0

        for control in controls:
            if control.status.name == "IMPLEMENTED":
                implemented_count += 1

        percentage = int((implemented_count / len(controls)) * 100)

        return percentage