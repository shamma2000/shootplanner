from datetime import date
from uuid import UUID

from sqlalchemy import Date, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, EntityMixin


class Event(EntityMixin, Base):
    __tablename__ = "events"

    client_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"))
    event_type: Mapped[str] = mapped_column(String(40), index=True)
    event_date: Mapped[date] = mapped_column(Date, index=True)
    location: Mapped[str] = mapped_column(String(255))
    hotel: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(30), default="Draft", index=True)
