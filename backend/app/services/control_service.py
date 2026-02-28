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

        from app.db.database import AsyncSessionLocal
        import json

        async with AsyncSessionLocal() as db:
            try:
                raw = await AIService.analyze_control(description)

                stmt = select(InternalControl).where(InternalControl.id == control_id)
                control = (await db.execute(stmt)).scalars().first()
                if not control:
                    return

                # Store raw response as the human-readable analysis
                control.ai_analysis = raw

                # Try to parse structured JSON
                try:
                    data = json.loads(raw)
                    suggested = data.get("suggested_risk", "").upper()
                    if suggested in ("HIGH", "MEDIUM", "LOW"):
                        control.ai_suggested_risk = suggested
                        # Also update the actual risk_score if AI confidence is high
                        confidence = float(data.get("confidence", 0))
                        if confidence >= 0.75:
                            control.risk_score = control.risk_score.__class__[suggested]
                    control.ai_category   = data.get("category", None)
                    control.ai_confidence = float(data.get("confidence", 0)) if "confidence" in data else None
                    # Rebuild human-readable analysis from structured data
                    gaps  = data.get("gaps", [])
                    recs  = data.get("recommendations", [])
                    summ  = data.get("summary", "")
                    control.ai_analysis = (
                        f"{summ}\n\n"
                        + ("Gaps:\n" + "\n".join(f"• {g}" for g in gaps) + "\n\n" if gaps else "")
                        + ("Recommendations:\n" + "\n".join(f"• {r}" for r in recs) if recs else "")
                    ).strip()
                except (json.JSONDecodeError, ValueError, KeyError):
                    logger.debug("AI returned non-JSON for control %s — storing raw text", control_id)

                await db.commit()
                logger.info("AI analysis saved for control %s", control_id)

            except Exception as e:
                logger.error("AI background task failed for control %s: %s", control_id, e)

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