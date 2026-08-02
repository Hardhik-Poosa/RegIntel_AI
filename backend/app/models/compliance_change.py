"""
ComplianceChange — records state-drift and compliance configuration changes detected during monitoring runs.
"""
from __future__ import annotations

from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.models.base import Base, UUIDMixin, TimestampMixin


class ComplianceChange(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "compliance_changes"

    organization_id = mapped_column(PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    control_id      = mapped_column(PGUUID(as_uuid=True), ForeignKey("controls.id",       ondelete="SET NULL"), nullable=True,  index=True)

    change_type     = mapped_column(String(64),  nullable=False)   # STATE_DRIFT | ENCRYPTION_DISABLED | EVIDENCE_EXPIRED | CONTROL_STATUS
    old_value       = mapped_column(Text,        nullable=True)
    new_value       = mapped_column(Text,        nullable=True)
    severity        = mapped_column(String(16),  nullable=False, default="HIGH")   # CRITICAL | HIGH | MEDIUM | LOW

    detected_at     = mapped_column(DateTime(timezone=True), nullable=False)
    resolved_at     = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<ComplianceChange(type={self.change_type}, severity={self.severity})>"
