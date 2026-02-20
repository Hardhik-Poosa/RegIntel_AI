from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.models.audit import AuditLog


class AuditService:

    @staticmethod
    async def log(
        db: AsyncSession,
        *,
        organization_id: UUID,
        user_id: UUID,
        action: str,
        entity_type: str,
        entity_id: UUID | None = None,
        details: str | None = None,
    ) -> None:

        log = AuditLog(
            organization_id=organization_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )

        db.add(log)
        await db.commit()