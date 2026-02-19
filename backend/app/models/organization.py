from sqlalchemy import String
from sqlalchemy.orm import relationship, mapped_column
from app.models.base import Base, UUIDMixin, TimestampMixin


class Organization(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "organizations"

    name = mapped_column(String, nullable=False)
    industry = mapped_column(String, nullable=True)
    subscription_tier = mapped_column(String, default="FREE")

    users = relationship(
        "User",
        back_populates="organization",
        cascade="all, delete-orphan"
    )
    def __repr__(self):
        return f"<Organization(id={self.id}, name='{self.name}', industry='{self.industry}', subscription_tier='{self.subscription_tier}')>"