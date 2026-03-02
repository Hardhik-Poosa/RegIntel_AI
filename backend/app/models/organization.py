from sqlalchemy import String, Integer
from sqlalchemy.orm import relationship, mapped_column
from app.models.base import Base, UUIDMixin, TimestampMixin


class Organization(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "organizations"

    name = mapped_column(String, nullable=False)
    industry = mapped_column(String, nullable=True)
    subscription_tier = mapped_column(String, default="FREE")

    # SaaS billing / plan limits (Phase 4D)
    plan_tier      = mapped_column(String, default="starter", nullable=False)
    ai_calls_used  = mapped_column(Integer, default=0, nullable=False)
    controls_limit = mapped_column(Integer, default=50, nullable=False)

    users = relationship(
        "User",
        back_populates="organization",
        cascade="all, delete-orphan"
    )
    def __repr__(self):
        return f"<Organization(id={self.id}, name='{self.name}', industry='{self.industry}', subscription_tier='{self.subscription_tier}')>"