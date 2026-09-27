from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Date, ForeignKey, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, EntityMixin


class Invoice(EntityMixin, Base):
    __tablename__ = "invoices"

    quotation_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("quotations.id", ondelete="RESTRICT"), unique=True
    )
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    due_date: Mapped[date] = mapped_column(Date, index=True)
    status: Mapped[str] = mapped_column(String(30), default="Pending", index=True)
