"""
ComplianceAlert — system-generated or user-acknowledged compliance alerts.

Alerts are created by:
  - The monitoring engine (automated checks)
  - The AI analysis pipeline (anomaly detection)
  - Manual user actions
"""
from __future__ import annotations

from sqlalchemy import String, Text, Boolean
from sqlalchemy.orm import mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy import ForeignKey

from app.models.base import Base, UUIDMixin, TimestampMixin


class ComplianceAlert(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "compliance_alerts"

    organization_id = mapped_column(PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    control_id      = mapped_column(PGUUID(as_uuid=True), ForeignKey("controls.id",       ondelete="SET NULL"), nullable=True)

    severity    = mapped_column(String(16),  nullable=False, default="HIGH")    # CRITICAL | HIGH | MEDIUM | LOW
    category    = mapped_column(String(64),  nullable=True)                     # MONITOR | AI | EVIDENCE | VENDOR
    message     = mapped_column(Text,        nullable=False)
    acknowledged = mapped_column(Boolean,    default=False, nullable=False)     # user dismissed

    def __repr__(self) -> str:
        return f"<ComplianceAlert(severity={self.severity}, ack={self.acknowledged})>"
