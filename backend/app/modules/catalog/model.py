from decimal import Decimal
from uuid import UUID

from sqlalchemy import JSON, Boolean, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, EntityMixin


class ServicePackage(EntityMixin, Base):
    __tablename__ = "service_packages"

    studio_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("studios.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(120))
    service_type: Mapped[str] = mapped_column(String(30), index=True)
    base_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    description: Mapped[str | None] = mapped_column(Text)
    deliverables: Mapped[list[str]] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)


class AddOn(EntityMixin, Base):
    __tablename__ = "add_ons"

    studio_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("studios.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(120))
    add_on_type: Mapped[str] = mapped_column(String(30), index=True)
    default_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
