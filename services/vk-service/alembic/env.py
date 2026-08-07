from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import settings
from app.infrastructure.db.base import Base
from app.infrastructure.db.models.executions import (  # noqa: F401
    VkExecution,
    VkExecutionAttempt,
)
from app.infrastructure.db.models.ingestion_part_diagnostics import (  # noqa: F401
    VkIngestionOversizedDiagnostic,
)
from app.infrastructure.db.models.ingestion_parts import (  # noqa: F401
    VkIngestionPartReference,
    VkIngestionStagingPart,
)
from app.infrastructure.db.models.ingestion_staging import (  # noqa: F401
    VkIngestionStagingBatch,
)
from app.infrastructure.db.models.ok_friends import (  # noqa: F401
    OkFriendsExportJob,
    OkFriendsJobLog,
    OkFriendsRecord,
)
from app.infrastructure.db.models.outbox import OutboxEvent  # noqa: F401
from app.infrastructure.db.models.provider_accounts import (  # noqa: F401
    VkProviderAccount,
)
from app.infrastructure.db.models.source_collections import (  # noqa: F401
    VkCollectionDemand,
    VkSourceCollection,
)
from app.infrastructure.db.models.tasks import ProcessedEvent  # noqa: F401
from app.infrastructure.db.models.vk_friends import (  # noqa: F401
    VkFriendsExportJob,
    VkFriendsJobLog,
    VkFriendsRecord,
)
from app.infrastructure.db.models.vk_ingestion import (  # noqa: F401
    VkAuthor,
    VkComment,
    VkGroup,
    VkIngestionCheckpoint,
    VkPost,
)

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    # Alembic is also invoked in-process by migration regression tests and
    # operational tooling. Disabling existing loggers here would mutate the
    # host process globally and silence service/test loggers after migration.
    fileConfig(config.config_file_name, disable_existing_loggers=False)

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
