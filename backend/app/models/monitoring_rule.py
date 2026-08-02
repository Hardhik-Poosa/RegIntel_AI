"""
MonitoringRule — configurable monitoring rule definitions for compliance checking.
"""
from __future__ import annotations

from sqlalchemy import String, Text, Boolean, ForeignKey
from sqlalchemy.orm import mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.models.base import Base, UUIDMixin, TimestampMixin


class MonitoringRule(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "monitoring_rules"

    organization_id = mapped_column(PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    rule_name       = mapped_column(String(128), nullable=False)
    condition_type  = mapped_column(String(64),  nullable=False)   # S3_PUBLIC_BLOCK | IAM_MFA_ENFORCED | EVIDENCE_VALIDITY | GITHUB_SECURITY_MD
    severity        = mapped_column(String(16),  nullable=False, default="HIGH")   # CRITICAL | HIGH | MEDIUM | LOW
    enabled         = mapped_column(Boolean,     nullable=False, default=True)
    description     = mapped_column(Text,        nullable=True)

    def __repr__(self) -> str:
        return f"<MonitoringRule(name='{self.rule_name}', enabled={self.enabled})>"
