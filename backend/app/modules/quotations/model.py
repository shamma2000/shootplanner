from decimal import Decimal
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, EntityMixin


class Quotation(EntityMixin, Base):
    __tablename__ = "quotations"

    event_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("events.id", ondelete="CASCADE"))
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    discount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    package_name: Mapped[str | None] = mapped_column(String(120))
    service_type: Mapped[str | None] = mapped_column(String(30))
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="Draft", index=True)
    items: Mapped[list["QuotationItem"]] = relationship(
        back_populates="quotation",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class QuotationItem(EntityMixin, Base):
    __tablename__ = "quotation_items"

    quotation_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("quotations.id", ondelete="CASCADE"), index=True
    )
    item_type: Mapped[str] = mapped_column(String(30), index=True)
    name: Mapped[str] = mapped_column(String(160))
    category: Mapped[str | None] = mapped_column(String(40))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    quotation: Mapped[Quotation] = relationship(back_populates="items")
