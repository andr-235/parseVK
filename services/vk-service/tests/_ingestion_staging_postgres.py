import asyncio
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from uuid import UUID

import asyncpg
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from testcontainers.core.container import DockerContainer

from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.infrastructure.db.base import Base
from app.infrastructure.db.models.executions import VkExecution, VkExecutionAttempt
from app.infrastructure.db.repositories.ingestion_staging import (
    SqlAlchemyIngestionStagingRepository,
)


async def _wait_for_postgres(*, host: str, port: int) -> None:
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
        except (OSError, asyncpg.PostgresError) as error:
            last_error = error
            await asyncio.sleep(0.1)
    raise RuntimeError("PostgreSQL staging test did not become ready") from last_error


async def _seed_execution(session_factory):
    now = datetime.now(UTC)
    execution = VkExecution(
        id=UUID("11111111-1111-1111-1111-111111111111"),
        task_id=1,
        owner_user_id="owner",
        run_id="run-1",
        status="running",
        plan_snapshot={"source": {"provider": "vk", "externalId": "42"}},
    )
    attempts = (
        VkExecutionAttempt(
            id=UUID("22222222-2222-2222-2222-222222222222"),
            execution_id=execution.id,
            attempt_number=1,
            fencing_token=7,
            worker_id="worker-1",
            status="running",
            provider_account_key="account-1",
            credential_version="v1",
            lease_expires_at=now + timedelta(minutes=1),
            heartbeat_at=now,
        ),
        VkExecutionAttempt(
            id=UUID("33333333-3333-3333-3333-333333333333"),
            execution_id=execution.id,
            attempt_number=2,
            fencing_token=8,
            worker_id="worker-2",
            status="failed",
            provider_account_key="account-1",
            credential_version="v1",
            lease_expires_at=now + timedelta(minutes=1),
            heartbeat_at=now,
        ),
    )
    async with session_factory() as session, session.begin():
        session.add_all([execution, *attempts])
    return execution, attempts


def make_batch(execution, attempt, *, offset=200, comment_id=1):
    return StagedIngestionBatch.create(
        execution_id=execution.id,
        attempt_id=attempt.id,
        fencing_token=attempt.fencing_token,
        source_kind="comments",
        owner_id=-42,
        post_id=99,
        page_offset=offset,
        payload={"comments": [{"id": comment_id}], "next_offset": offset + 100},
    )


async def stage(session_factory, batch):
    async with session_factory() as session, session.begin():
        return await SqlAlchemyIngestionStagingRepository(session).stage(batch)


@asynccontextmanager
async def staging_postgres():
    container = (
        DockerContainer("postgres:16-alpine")
        .with_env("POSTGRES_USER", "postgres")
        .with_env("POSTGRES_PASSWORD", "postgres")
        .with_env("POSTGRES_DB", "postgres")
        .with_exposed_ports(5432)
    )
    container.start()
    engine = None
    try:
        host = container.get_container_host_ip()
        port = int(container.get_exposed_port(5432))
        await _wait_for_postgres(host=host, port=port)
        engine = create_async_engine(
            f"postgresql+asyncpg://postgres:postgres@{host}:{port}/postgres",
            pool_pre_ping=True,
        )
        session_factory = async_sessionmaker(engine, expire_on_commit=False)
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        execution, attempts = await _seed_execution(session_factory)
        yield session_factory, execution, attempts
    finally:
        if engine is not None:
            await engine.dispose()
        container.stop()
