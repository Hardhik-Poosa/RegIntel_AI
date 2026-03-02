"""
ComplianceMonitor — stores the result of each automated compliance check run.

Each record captures a point-in-time PASS/FAIL status for a specific control,
so the dashboard can show a per-control health history.
"""
from __future__ import annotations

from sqlalchemy import String, Text, Boolean
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy import ForeignKey

from app.models.base import Base, UUIDMixin, TimestampMixin


class ComplianceMonitor(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "compliance_monitors"

    organization_id = mapped_column(PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    control_id      = mapped_column(PGUUID(as_uuid=True), ForeignKey("controls.id",       ondelete="CASCADE"), nullable=True,  index=True)

    check_type = mapped_column(String(64),  nullable=False, default="MANUAL")   # GITHUB | AWS | MANUAL | SCHEDULED
    status     = mapped_column(String(16),  nullable=False, default="PASS")     # PASS | FAIL | WARNING
    message    = mapped_column(Text,        nullable=True)
    details    = mapped_column(Text,        nullable=True)   # JSON blob with raw check output

    def __repr__(self) -> str:
        return f"<ComplianceMonitor(status={self.status}, type={self.check_type})>"
