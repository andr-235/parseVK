import asyncio
import os
from datetime import UTC, datetime, timedelta
from uuid import UUID

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from testcontainers.core.container import DockerContainer

from app.db.base import Base
from app.db.models import OutboxEvent
from app.modules.outbox.repository import OutboxRepository

REPEATS = int(os.getenv("P0_P2_CONCURRENCY_REPEATS", "1"))
REQUEST_ID = UUID("00000000-0000-0000-0000-000000000001")
CANCEL_ID = UUID("00000000-0000-0000-0000-000000000002")


@pytest.fixture(scope="module")
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
    yield f"postgresql+asyncpg://postgres:postgres@{host}:{port}/postgres"
    container.stop()


@pytest.fixture
async def pg_factory(postgres_url):
    engine = create_async_engine(postgres_url, pool_pre_ping=True)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    yield factory
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
    await engine.dispose()


async def _wait_for_postgres(host: str, port: int) -> None:
    import asyncpg

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


async def _seed(factory) -> None:
    created_at = datetime.now(UTC) - timedelta(seconds=1)
    async with factory() as session:
        async with session.begin():
            session.add_all(
                [
                    OutboxEvent(
                        id=REQUEST_ID,
                        event_type="vk.execution.requested",
                        aggregate_type="vk_execution",
                        aggregate_id="execution-1",
                        correlation_id="execution-1",
                        dedupe_key="vk.execution.requested:execution-1",
                        payload={"executionId": "execution-1"},
                        created_at=created_at,
                        next_attempt_at=created_at,
                    ),
                    OutboxEvent(
                        id=CANCEL_ID,
                        event_type="vk.execution.cancel_requested",
                        aggregate_type="vk_execution",
                        aggregate_id="execution-1",
                        correlation_id="execution-1",
                        dedupe_key="vk.execution.cancel_requested:execution-1",
                        payload={"executionId": "execution-1"},
                        created_at=created_at + timedelta(microseconds=1),
                        next_attempt_at=created_at,
                    ),
                ]
            )


@pytest.mark.anyio
@pytest.mark.parametrize("_repeat", range(REPEATS))
async def test_cancellation_cannot_overtake_pending_request(pg_factory, _repeat):
    await _seed(pg_factory)

    async with pg_factory() as first_session:
        async with first_session.begin():
            first_repository = OutboxRepository(first_session)
            locked = await first_repository.lock_pending(limit=10)
            assert [event.id for event in locked] == [REQUEST_ID]

            async with pg_factory() as second_session:
                async with second_session.begin():
                    second_locked = await OutboxRepository(
                        second_session
                    ).lock_pending(limit=10)
                    assert second_locked == []

            await first_repository.mark_published(locked[0])

    async with pg_factory() as session:
        async with session.begin():
            repository = OutboxRepository(session)
            locked = await repository.lock_pending(limit=10)
            assert [event.id for event in locked] == [CANCEL_ID]
