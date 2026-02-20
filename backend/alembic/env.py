import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Import your app settings and Base
from app.core.config import settings
from app.models.base import Base
from app.models.user import User
from app.models.organization import Organization
from app.models.control import InternalControl
from app.core.config import settings
from app.models.audit import AuditLog
# Alembic Config object
config = context.config

config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)


# Override database URL from settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Tell Alembic about your models
target_metadata = Base.metadata


# -----------------------------
# OFFLINE MODE
# -----------------------------
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# -----------------------------
# ONLINE MODE (ASYNC)
# -----------------------------
def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    def do_run_migrations(connection):
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()

    async def run():
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)

    asyncio.run(run())



if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
