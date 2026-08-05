import asyncio

import asyncpg
import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from testcontainers.core.container import DockerContainer

from app.infrastructure.db.base import Base
from app.infrastructure.db.models.executions import (  # noqa: F401
    VkExecution,
    VkExecutionAttempt,
)
from app.infrastructure.db.models.ok_friends import (  # noqa: F401
    OkFriendsExportJob,
    OkFriendsJobLog,
    OkFriendsRecord,
)
from app.infrastructure.db.models.outbox import OutboxEvent  # noqa: F401
from app.infrastructure.db.models.provider_accounts import VkProviderAccount  # noqa: F401
from app.infrastructure.db.models.source_collections import (  # noqa: F401
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
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


@pytest.fixture(scope="session")
def postgres_url():
    container = (
        DockerContainer("postgres:16-alpine")
        .with_env("POSTGRES_USER", "postgres")
        .with_env("POSTGRES_PASSWORD", "postgres")
        .with_env("POSTGRES_DB", "postgres")
        .with_exposed_ports(5432)
    )
    container.start()
    host = container.get_container_host_ip()
    port = int(container.get_exposed_port(5432))
    asyncio.run(_wait_for_postgres(host, port))
    try:
        yield f"postgresql+asyncpg://postgres:postgres@{host}:{port}/postgres"
    finally:
        container.stop()


@pytest.fixture
async def pg_factory(postgres_url):
    engine = create_async_engine(postgres_url, pool_pre_ping=True)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    try:
        yield factory
    finally:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
        await engine.dispose()


async def _wait_for_postgres(host: str, port: int) -> None:
    last_error = None
    for _ in range(100):
        try:
            connection = await asyncpg.connect(
                host=host,
                port=port,
                user="postgres",
                password="postgres",
                database="postgres",
            )
            await connection.close()
            return
        except (OSError, asyncpg.PostgresError) as exc:
            last_error = exc
            await asyncio.sleep(0.1)
    raise RuntimeError("PostgreSQL test container did not become ready") from last_error
