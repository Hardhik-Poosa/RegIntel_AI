"""
ComplianceJob — stores the execution record of continuous compliance monitoring jobs.

Captures job status, trigger type (NIGHTLY_CRON, MANUAL, WEBHOOK), check counts,
error logs, and start/completion timestamps.
"""
from __future__ import annotations

from datetime import datetime
from sqlalchemy import String, Text, Integer, DateTime
from sqlalchemy.orm import mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy import ForeignKey

from app.models.base import Base, UUIDMixin, TimestampMixin


class ComplianceJob(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "compliance_jobs"

    organization_id = mapped_column(PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    trigger_type   = mapped_column(String(32),  nullable=False, default="NIGHTLY_CRON")  # NIGHTLY_CRON | MANUAL | WEBHOOK
    status         = mapped_column(String(32),  nullable=False, default="PENDING")       # PENDING | RUNNING | COMPLETED | FAILED
    total_checks   = mapped_column(Integer,     nullable=False, default=0)
    passed_checks  = mapped_column(Integer,     nullable=False, default=0)
    failed_checks  = mapped_column(Integer,     nullable=False, default=0)
    error_log      = mapped_column(Text,        nullable=True)

    started_at     = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at   = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<ComplianceJob(id={self.id}, status={self.status}, trigger={self.trigger_type})>"
