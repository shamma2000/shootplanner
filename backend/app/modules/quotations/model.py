from decimal import Decimal
from uuid import UUID

from sqlalchemy import ForeignKey, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, EntityMixin


class Quotation(EntityMixin, Base):
    __tablename__ = "quotations"

    event_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("events.id", ondelete="CASCADE"))
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    discount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(30), default="Draft", index=True)
