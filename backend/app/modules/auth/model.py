from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, EntityMixin


class Studio(EntityMixin, Base):
    __tablename__ = "studios"

    name: Mapped[str] = mapped_column(String(120))
    subdomain: Mapped[str] = mapped_column(String(63), unique=True, index=True)


class User(EntityMixin, Base):
    __tablename__ = "users"

    studio_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("studios.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(30))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), default="owner")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
