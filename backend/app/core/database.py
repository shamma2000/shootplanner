from collections.abc import AsyncIterator
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Uuid, func
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.pool import NullPool

from app.core.config import settings


class Base(DeclarativeBase):
    pass


class EntityMixin:
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


database_url = make_url(settings.database_url)
uses_transaction_pooler = database_url.port == 6543 or database_url.query.get("pgbouncer") == "true"
database_url = database_url.difference_update_query(["pgbouncer"])
engine_options: dict[str, object] = {
    "echo": settings.database_echo,
    "pool_pre_ping": True,
}

# Supabase transaction mode already pools connections and does not support
# prepared statements. Disable both asyncpg and SQLAlchemy-side caches.
if uses_transaction_pooler:
    engine_options["poolclass"] = NullPool
    engine_options["connect_args"] = {
        "prepared_statement_cache_size": 0,
        "statement_cache_size": 0,
    }

engine = create_async_engine(database_url, **engine_options)
SessionFactory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        yield session
