import enum
from sqlalchemy import Column, String, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, UUIDMixin, TimestampMixin


class ControlStatus(str, enum.Enum):
    IMPLEMENTED = "IMPLEMENTED"
    PARTIAL = "PARTIAL"
    MISSING = "MISSING"


class ControlRisk(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class InternalControl(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "controls"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(ControlStatus), default=ControlStatus.MISSING)
    risk_score = Column(Enum(ControlRisk), default=ControlRisk.MEDIUM)

    # AI STORAGE
    ai_analysis = Column(Text, nullable=True)

    organization = relationship("Organization")
    created_by = relationship("User")