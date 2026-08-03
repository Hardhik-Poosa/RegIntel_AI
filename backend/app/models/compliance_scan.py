"""
ComplianceScan — historical execution log for individual compliance scan runs.
"""
from __future__ import annotations

from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.models.base import Base, UUIDMixin, TimestampMixin


class ComplianceScan(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "compliance_scans"

    organization_id  = mapped_column(PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    scan_type        = mapped_column(String(64),  nullable=False)   # FULL_SUITE | AWS_POSTURE | EVIDENCE_EXPIRATION | GITHUB_SCAN
    status           = mapped_column(String(32),  nullable=False, default="SUCCESS")  # SUCCESS | WARNING | FAILED
    items_scanned    = mapped_column(Integer,     nullable=False, default=0)
    assets_scanned   = mapped_column(Integer,     nullable=False, default=0)
    failures_found   = mapped_column(Integer,     nullable=False, default=0)
    errors           = mapped_column(Integer,     nullable=False, default=0)
    duration_seconds = mapped_column(Float,       nullable=False, default=0.0)

    started_at       = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at     = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at      = mapped_column(DateTime(timezone=True), nullable=True)


    def __repr__(self) -> str:
        return f"<ComplianceScan(type={self.scan_type}, status={self.status}, failures={self.failures_found})>"
