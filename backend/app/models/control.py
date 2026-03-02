import enum
from sqlalchemy import Column, String, Text, ForeignKey, Enum, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDMixin, TimestampMixin


class AIStatus(str, enum.Enum):
    PENDING    = "pending"
    PROCESSING = "processing"
    DONE       = "done"
    FAILED     = "failed"


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
        Enum(ControlStatus, name="controlstatus"),
        default=ControlStatus.MISSING,
        nullable=False,
    )

    risk_score = Column(
        Enum(ControlRisk, name="controlrisk"),
        default=ControlRisk.MEDIUM,
        nullable=False,
    )

    # Framework association (Phase 4)
    framework_id = Column(
        UUID(as_uuid=True),
        ForeignKey("frameworks.id", ondelete="SET NULL"),
        nullable=True,
    )
    framework = relationship("ComplianceFramework", back_populates="controls")

    # AI pipeline fields
    ai_status         = Column(String, default="pending", nullable=False, server_default="pending")
    ai_analysis       = Column(Text,   nullable=True)
    ai_suggested_risk = Column(String, nullable=True)   # HIGH / MEDIUM / LOW
    ai_category       = Column(String, nullable=True)   # e.g. ACCESS_CONTROL
    ai_confidence     = Column(Float,  nullable=True)   # 0.0 – 1.0

    # Compliance scoring
    compliance_score = Column(Integer, default=0, nullable=False)

    # Relationships
    organization = relationship("Organization")
    created_by = relationship("User")