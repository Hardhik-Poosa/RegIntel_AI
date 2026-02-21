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

        implemented = 0

        for control in controls:
            if control.status.name == "IMPLEMENTED":
                implemented += 1

        return int((implemented / len(controls)) * 100)

    @staticmethod
    async def update_control_scores(
        db: AsyncSession,
        organization_id: UUID,
    ) -> None:

        score = await ComplianceService.calculate_score(
            db,
            organization_id,
        )

        stmt = select(InternalControl).where(
            InternalControl.organization_id == organization_id
        )

        result = await db.execute(stmt)
        controls = result.scalars().all()

        for control in controls:
            control.compliance_score = score

        await db.commit()