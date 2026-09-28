import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context
from app.core.config import settings
from app.core.database import Base
from app.modules.auth.model import Studio, User  # noqa: F401
from app.modules.bookings.model import Booking  # noqa: F401
from app.modules.catalog.model import AddOn, ServicePackage  # noqa: F401
from app.modules.clients.model import Client  # noqa: F401
from app.modules.events.model import Event  # noqa: F401
from app.modules.invoices.model import DeliveryItem, Invoice  # noqa: F401
from app.modules.quotations.model import Quotation, QuotationItem  # noqa: F401

config = context.config
migration_database_url = settings.migration_database_url
config.set_main_option("sqlalchemy.url", migration_database_url.replace("%", "%%"))
if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=migration_database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
