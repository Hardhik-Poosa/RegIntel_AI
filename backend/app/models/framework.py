"""
Compliance Framework model.

Represents a regulatory / security framework (SOC 2, RBI FinTech, EU AI Act, etc.).
Each framework groups a set of compliance controls.
"""
from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDMixin, TimestampMixin


class ComplianceFramework(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "frameworks"

    # Short name: "SOC 2", "EU AI Act", "RBI FinTech"
    name = Column(String, nullable=False, unique=True)

    # Top-level category: "Security" | "Financial" | "AI Governance"
    category = Column(String, nullable=False)

    # Longer human description
    description = Column(Text, nullable=True)

    # Which controls belong to this framework
    controls = relationship("InternalControl", back_populates="framework")

    def __repr__(self):
        return f"<ComplianceFramework(name='{self.name}', category='{self.category}')>"
