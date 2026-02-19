import enum
from sqlalchemy import String, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, UUIDMixin, TimestampMixin


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    COMPLIANCE_OFFICER = "COMPLIANCE_OFFICER"
    AUDITOR = "AUDITOR"
    VIEWER = "VIEWER"


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password = mapped_column(String, nullable=False)

    role = mapped_column(
        Enum(UserRole, name="user_role"),
        default=UserRole.VIEWER
    )

    is_active = mapped_column(Boolean, default=True)

    organization_id = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        nullable=False
    )

    organization = relationship("Organization", back_populates="users")
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}', is_active={self.is_active})>"