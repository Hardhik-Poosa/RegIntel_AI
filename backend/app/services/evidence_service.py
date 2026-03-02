"""
Evidence Service — CRUD for ControlEvidence records.

Upload flow:
  1. API receives UploadFile → saves to uploads/ dir
  2. Creates ControlEvidence row (ai_valid=None = "pending scan")
  3. Triggers AI scanner asynchronously
  4. AI scanner updates ai_valid, ai_confidence, ai_explanation
"""
from __future__ import annotations

import logging
import os
import uuid
from pathlib import Path
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.evidence import ControlEvidence

logger = logging.getLogger(__name__)

# Local upload directory — relative to the repository root.
# In production swap file_url for an S3 pre-signed URL.
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class EvidenceService:

    @staticmethod
    async def save_file(file_bytes: bytes, original_filename: str, mime_type: str | None) -> tuple[str, float]:
        """
        Persist bytes to the uploads/ directory.
        Returns (relative_path, size_bytes).
        """
        ext      = Path(original_filename).suffix or ".bin"
        safe_name = f"{uuid.uuid4()}{ext}"
        dest      = UPLOAD_DIR / safe_name
        dest.write_bytes(file_bytes)
        return str(dest), float(len(file_bytes))

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        control_id: UUID,
        uploaded_by: UUID | None,
        file_name: str,
        file_url: str,
        file_size: float | None,
        mime_type: str | None,
    ) -> ControlEvidence:
        ev = ControlEvidence(
            control_id  = control_id,
            uploaded_by = uploaded_by,
            file_name   = file_name,
            file_url    = file_url,
            file_size   = file_size,
            mime_type   = mime_type,
            # AI fields start as None (unscanned)
        )
        db.add(ev)
        await db.commit()
        await db.refresh(ev)
        logger.info("Evidence created: %s for control %s", ev.id, control_id)
        return ev

    @staticmethod
    async def list_for_control(db: AsyncSession, *, control_id: UUID) -> List[ControlEvidence]:
        result = await db.execute(
            select(ControlEvidence)
            .where(ControlEvidence.control_id == control_id)
            .order_by(ControlEvidence.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, *, evidence_id: UUID) -> Optional[ControlEvidence]:
        result = await db.execute(
            select(ControlEvidence).where(ControlEvidence.id == evidence_id)
        )
        return result.scalars().first()

    @staticmethod
    async def delete(db: AsyncSession, *, ev: ControlEvidence) -> None:
        """Delete DB row and the underlying file if it exists."""
        try:
            if ev.file_url and os.path.isfile(ev.file_url):
                os.remove(ev.file_url)
        except OSError as exc:
            logger.warning("Could not remove evidence file %s: %s", ev.file_url, exc)
        await db.delete(ev)
        await db.commit()
        logger.info("Evidence deleted: %s", ev.id)

    @staticmethod
    async def update_ai_result(
        db: AsyncSession,
        *,
        ev: ControlEvidence,
        ai_valid: bool,
        ai_confidence: float,
        ai_explanation: str,
    ) -> ControlEvidence:
        ev.ai_valid       = ai_valid
        ev.ai_confidence  = ai_confidence
        ev.ai_explanation = ai_explanation
        await db.commit()
        await db.refresh(ev)
        return ev
