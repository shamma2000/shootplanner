from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, EntityMixin


class Invoice(EntityMixin, Base):
    __tablename__ = "invoices"

    quotation_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("quotations.id", ondelete="RESTRICT"), unique=True
    )
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    advance_paid: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=0, server_default="0"
    )
    due_date: Mapped[date] = mapped_column(Date, index=True)
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="Pending", index=True)
    deliveries: Mapped[list["DeliveryItem"]] = relationship(
        back_populates="invoice",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    @property
    def balance_due(self) -> Decimal:
        return max(Decimal("0"), self.amount - self.advance_paid)


class DeliveryItem(EntityMixin, Base):
    __tablename__ = "delivery_items"

    invoice_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("invoices.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(160))
    status: Mapped[str] = mapped_column(String(30), default="Pending", index=True)
    due_date: Mapped[date | None] = mapped_column(Date)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    invoice: Mapped[Invoice] = relationship(back_populates="deliveries")
