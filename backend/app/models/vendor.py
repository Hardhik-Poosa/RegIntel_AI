"""
Vendor — represents a third-party supplier / technology partner.

Risk level is calculated by the VendorService based on category and
any linked compliance issues.
"""
from __future__ import annotations

from sqlalchemy import String, Text
from sqlalchemy.orm import mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy import ForeignKey

from app.models.base import Base, UUIDMixin, TimestampMixin


class Vendor(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "vendors"

    organization_id = mapped_column(PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    name           = mapped_column(String(256), nullable=False)
    category       = mapped_column(String(128), nullable=True)   # e.g. "Payment", "Infrastructure", "SaaS"
    website        = mapped_column(String(512), nullable=True)
    description    = mapped_column(Text,        nullable=True)
    risk_level     = mapped_column(String(16),  default="MEDIUM", nullable=False)  # HIGH | MEDIUM | LOW
    review_status  = mapped_column(String(32),  default="PENDING", nullable=False) # PENDING | REVIEWED | FLAGGED
    notes          = mapped_column(Text,        nullable=True)

    def __repr__(self) -> str:
        return f"<Vendor(name='{self.name}', risk='{self.risk_level}')>"
