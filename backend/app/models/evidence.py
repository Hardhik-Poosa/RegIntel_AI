"""
ControlEvidence — stores uploaded evidence files linked to a compliance control.
Each file can be scanned by the AI Evidence Scanner for validity checking.
"""
from __future__ import annotations

from sqlalchemy import String, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.models.base import Base, UUIDMixin, TimestampMixin


class ControlEvidence(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "control_evidence"

    # ── Core fields ───────────────────────────────────────────────────────────
    control_id  = mapped_column(PGUUID(as_uuid=True), ForeignKey("controls.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id",    ondelete="SET NULL"),  nullable=True)

    file_name   = mapped_column(String(512), nullable=False)          # original filename
    file_url    = mapped_column(String(2048), nullable=False)         # local path or S3 URL
    file_size   = mapped_column(Float, nullable=True)                 # bytes
    mime_type   = mapped_column(String(128), nullable=True)

    # ── AI scanner results ────────────────────────────────────────────────────
    ai_valid       = mapped_column(Boolean, nullable=True)            # True / False / None (not yet scanned)
    ai_confidence  = mapped_column(Float, nullable=True)              # 0.0 – 1.0
    ai_explanation = mapped_column(Text, nullable=True)               # LLM explanation text

    # ── Relationships ─────────────────────────────────────────────────────────
    control  = relationship("InternalControl", back_populates="evidence_files")

    def __repr__(self) -> str:
        return f"<ControlEvidence(id={self.id}, file='{self.file_name}', valid={self.ai_valid})>"
