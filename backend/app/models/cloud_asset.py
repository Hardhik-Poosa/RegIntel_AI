"""
CloudAsset — tracks infrastructure assets (S3 Buckets, IAM Roles, GitHub Repos, Lambdas) monitored by RegintelAI.
"""
from __future__ import annotations

from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.models.base import Base, UUIDMixin, TimestampMixin


class CloudAsset(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "cloud_assets"

    organization_id = mapped_column(PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    provider        = mapped_column(String(32),  nullable=False)   # AWS | GITHUB | AZURE | GCP
    asset_type      = mapped_column(String(64),  nullable=False)   # S3_BUCKET | IAM_ROLE | GITHUB_REPO | LAMBDA_FUNCTION
    name            = mapped_column(String(256), nullable=False)
    owner           = mapped_column(String(128), nullable=True)
    risk_level      = mapped_column(String(16),  nullable=False, default="LOW")    # HIGH | MEDIUM | LOW

    last_seen       = mapped_column(DateTime(timezone=True), nullable=False)

    def __repr__(self) -> str:
        return f"<CloudAsset(name='{self.name}', provider={self.provider}, risk={self.risk_level})>"
