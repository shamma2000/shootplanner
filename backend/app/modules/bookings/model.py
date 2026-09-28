from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import CheckConstraint, Date, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, EntityMixin


class Booking(EntityMixin, Base):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint(
            "deposit_amount >= 0",
            name="ck_bookings_deposit_amount_nonnegative",
        ),
    )

    studio_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("studios.id", ondelete="CASCADE"), index=True
    )
    client_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("clients.id", ondelete="CASCADE"), index=True
    )
    event_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("events.id", ondelete="CASCADE"), unique=True
    )
    booking_date: Mapped[date] = mapped_column(Date, index=True)
    status: Mapped[str] = mapped_column(String(30), default="Pending", index=True)
    deposit_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    notes: Mapped[str | None] = mapped_column(Text)
