import enum
from sqlalchemy import Column, String, Text, ForeignKey, Enum, Integer
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

    status = Column(
        Enum(ControlStatus, name="control_status"),
        default=ControlStatus.MISSING,
        nullable=False,
    )

    risk_score = Column(
        Enum(ControlRisk, name="control_risk"),
        default=ControlRisk.MEDIUM,
        nullable=False,
    )

    # AI STORAGE
    ai_analysis = Column(Text, nullable=True)

    # Compliance scoring
    compliance_score = Column(Integer, default=0, nullable=False)

    # Relationships
    organization = relationship("Organization")
    created_by = relationship("User")