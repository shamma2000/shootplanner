from uuid import UUID

from sqlalchemy import ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, EntityMixin


class Client(EntityMixin, Base):
    __tablename__ = "clients"

    bride_name: Mapped[str] = mapped_column(String(120))
    groom_name: Mapped[str] = mapped_column(String(120))
    primary_phone: Mapped[str] = mapped_column(String(30), index=True)
    optional_phone: Mapped[str | None] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(255), index=True)
    address: Mapped[str | None] = mapped_column(String(500))
    studio_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("studios.id", ondelete="CASCADE"), index=True
    )
