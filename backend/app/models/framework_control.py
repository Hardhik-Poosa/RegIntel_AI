"""
FrameworkControl — pre-built control templates for each compliance framework.
These are seed data that organisations can install into their workspace with
a single click (POST /frameworks/{id}/install).
"""
from __future__ import annotations

from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.models.base import Base, UUIDMixin, TimestampMixin
from app.models.control import ControlRisk


class FrameworkControl(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "framework_controls"

    framework_id  = mapped_column(PGUUID(as_uuid=True), ForeignKey("frameworks.id", ondelete="CASCADE"), nullable=False, index=True)

    title         = mapped_column(String(255), nullable=False)
    description   = mapped_column(Text, nullable=True)
    risk_score    = mapped_column(String(16), default="MEDIUM", nullable=False)   # HIGH / MEDIUM / LOW
    status_hint   = mapped_column(String(64), nullable=True)                      # hint for where to look
    control_ref   = mapped_column(String(64), nullable=True)                      # e.g. "PCI 3.4", "ISO A.9.1"

    # Relationship back to parent framework
    framework     = relationship("ComplianceFramework", back_populates="template_controls")

    def __repr__(self) -> str:
        return f"<FrameworkControl(ref='{self.control_ref}', title='{self.title[:40]}')>"
