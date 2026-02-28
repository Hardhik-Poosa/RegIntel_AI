import uuid as _uuid
import enum
from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, UUIDMixin, TimestampMixin


class ComplianceSnapshot(Base, UUIDMixin, TimestampMixin):
    """
    Point-in-time compliance score snapshot per organisation.
    Written every time update_control_scores() is called.
    Used to draw the compliance trend chart.
    """
    __tablename__ = "compliance_snapshots"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    score = Column(Integer, nullable=False)

    def __repr__(self):
        return f"<ComplianceSnapshot(org={self.organization_id}, score={self.score})>"
