from logging.config import fileConfig

from alembic import context
from app.core.config import settings
from app.db.base import Base
from app.domain.models.ok_friends import (  # noqa: F401
    OkFriendsExportJob,
    OkFriendsJobLog,
    OkFriendsRecord,
)
from app.domain.models.outbox import OutboxEvent  # noqa: F401
from app.domain.models.tasks import ProcessedEvent, VkTaskRun  # noqa: F401
from app.domain.models.vk_friends import (  # noqa: F401
    VkFriendsExportJob,
    VkFriendsJobLog,
    VkFriendsRecord,
)

# Import all domain models to ensure they are registered with DeclarativeBase metadata for Alembic
from app.domain.models.vk_ingestion import VkAuthor, VkComment, VkGroup, VkPost  # noqa: F401
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    import asyncio

    asyncio.run(run_async_migrations())


run_migrations_online()
