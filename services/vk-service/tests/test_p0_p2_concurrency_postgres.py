import asyncio
import os
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from parsevk_contracts.vk.commands import VkExecutionRequested
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from testcontainers.core.container import DockerContainer

from _canonical_runtime_helpers import (
    cancel_command,
    make_command,
    seed_account,
)
from app.domain.repositories.checkpoint import CheckpointData
from app.infrastructure.db.base import Base
from app.infrastructure.db.models.executions import VkExecution  # noqa: F401
from app.infrastructure.db.models.ok_friends import (  # noqa: F401
    OkFriendsExportJob,
    OkFriendsJobLog,
    OkFriendsRecord,
)
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.provider_accounts import VkProviderAccount  # noqa: F401
from app.infrastructure.db.models.source_collections import (
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
from app.infrastructure.db.repositories.canonical_binding_progress import (
    report_binding_progress,
)
from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)
from app.infrastructure.db.repositories.canonical_executions import (
    CanonicalExecutionRepository,
)
from app.infrastructure.db.repositories.checkpoint import (
    SqlAlchemyIngestionCheckpointStore,
)
from app.tasks.execution_control import ExecutionAttemptControl, FenceLostError

REPEATS = int(os.getenv("P0_P2_CONCURRENCY_REPEATS", "1"))


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


async def _attach(factory, command):
    async with factory() as session:
        async with session.begin():
            return await CanonicalVkCommandRepository(session).attach_command(command)


async def _cancel(factory, command):
    async with factory() as session:
        async with session.begin():
            return await CanonicalVkCommandRepository(session).request_cancellation(
                cancel_command(command)
            )


def _two_source_command(task_id: int) -> VkExecutionRequested:
    first = make_command(task_id=task_id, source_id=uuid4(), external_id=7001)
    second = make_command(task_id=task_id, source_id=uuid4(), external_id=7002)
    return VkExecutionRequested(
        task_id=first.task_id,
        task_run_id=first.task_run_id,
        execution_id=first.execution_id,
        owner_user_id=first.owner_user_id,
        demands=(first.demands[0], second.demands[0]),
        post_selection=first.post_selection,
        comment_selection=first.comment_selection,
        task_revision=first.task_revision,
        source_set_revision=first.source_set_revision,
        snapshot_sha256=first.snapshot_sha256,
    )


@pytest.mark.anyio
@pytest.mark.parametrize("_repeat", range(REPEATS))
async def test_concurrent_compatible_attachments_coalesce(pg_factory, _repeat):
    source_id = uuid4()
    first = make_command(task_id=3001, source_id=source_id)
    second = make_command(task_id=3002, source_id=source_id)

    await asyncio.gather(
        _attach(pg_factory, first),
        _attach(pg_factory, second),
    )

    async with pg_factory() as session:
        assert await session.scalar(select(func.count(VkSourceCollection.id))) == 1
        assert await session.scalar(select(func.count(VkExecution.id))) == 1
        assert await session.scalar(select(func.count(VkCollectionDemand.id))) == 2
        assert await session.scalar(select(func.count(VkTaskRunBinding.id))) == 2


@pytest.mark.anyio
@pytest.mark.parametrize("_repeat", range(REPEATS))
async def test_cancellation_racing_with_attachment_loses_neither_intent(
    pg_factory,
    _repeat,
):
    source_id = uuid4()
    first = make_command(task_id=3101, source_id=source_id)
    second = make_command(task_id=3102, source_id=source_id)
    await _attach(pg_factory, first)

    await asyncio.gather(
        _cancel(pg_factory, first),
        _attach(pg_factory, second),
    )

    async with pg_factory() as session:
        first_binding = await session.scalar(
            select(VkTaskRunBinding).where(
                VkTaskRunBinding.run_id == str(first.task_run_id)
            )
        )
        second_binding = await session.scalar(
            select(VkTaskRunBinding).where(
                VkTaskRunBinding.run_id == str(second.task_run_id)
            )
        )
        active_collections = await session.scalar(
            select(func.count(VkSourceCollection.id)).where(
                VkSourceCollection.status.in_(("pending", "running"))
            )
        )
        assert first_binding is not None and first_binding.status == "cancelled"
        assert second_binding is not None
        assert second_binding.status in {"pending", "running"}
        assert active_collections == 1


@pytest.mark.anyio
@pytest.mark.parametrize("_repeat", range(REPEATS))
async def test_progress_and_terminal_updates_emit_one_taskrun_terminal(
    pg_factory,
    _repeat,
):
    command = _two_source_command(task_id=3201)
    await _attach(pg_factory, command)
    async with pg_factory() as session:
        async with session.begin():
            await seed_account(session)
            repository = CanonicalExecutionRepository(session)
            first = await repository.claim_next(
                worker_id="worker-a",
                lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
            )
            second = await repository.claim_next(
                worker_id="worker-b",
                lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
            )
    assert first is not None and second is not None

    async def progress():
        async with pg_factory() as session:
            async with session.begin():
                return await report_binding_progress(
                    session,
                    execution_id=first.execution_id,
                    processed_items=3,
                    total_items=10,
                    stats={"comments": 3},
                    occurred_at=datetime.now(UTC).isoformat(),
                )

    async def complete_second():
        async with pg_factory() as session:
            async with session.begin():
                return await CanonicalExecutionRepository(session).complete(
                    execution_id=second.execution_id,
                    attempt_id=second.attempt_id,
                    fencing_token=second.fencing_token,
                    processed_items=7,
                    total_items=7,
                    stats={"comments": 7},
                )

    emitted, completed = await asyncio.gather(progress(), complete_second())
    assert emitted == 1
    assert completed

    async with pg_factory() as session:
        async with session.begin():
            binding = await session.scalar(
                select(VkTaskRunBinding).where(
                    VkTaskRunBinding.run_id == str(command.task_run_id)
                )
            )
            terminal_count = await session.scalar(
                select(func.count(OutboxEvent.id)).where(
                    OutboxEvent.event_type == "task.execution_completed",
                    OutboxEvent.aggregate_id == str(command.task_id),
                )
            )
            assert binding is not None and binding.status == "running"
            assert terminal_count == 0
            assert await CanonicalExecutionRepository(session).complete(
                execution_id=first.execution_id,
                attempt_id=first.attempt_id,
                fencing_token=first.fencing_token,
                processed_items=10,
                total_items=10,
                stats={"comments": 10},
            )

    async with pg_factory() as session:
        terminal_events = list(
            (
                await session.scalars(
                    select(OutboxEvent).where(
                        OutboxEvent.event_type == "task.execution_completed",
                        OutboxEvent.aggregate_id == str(command.task_id),
                    )
                )
            ).all()
        )
        assert len(terminal_events) == 1


@pytest.mark.anyio
@pytest.mark.parametrize("_repeat", range(REPEATS))
async def test_stale_attempt_cannot_commit_checkpoint_or_terminal(
    pg_factory,
    _repeat,
):
    command = make_command(task_id=3301, source_id=uuid4(), external_id=1)
    await _attach(pg_factory, command)
    async with pg_factory() as session:
        async with session.begin():
            await seed_account(session)
            repository = CanonicalExecutionRepository(session)
            stale = await repository.claim_next(
                worker_id="stale-worker",
                lease_expires_at=datetime.now(UTC) - timedelta(seconds=1),
            )
            current = await repository.claim_next(
                worker_id="current-worker",
                lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
            )
    assert stale is not None and current is not None
    control = ExecutionAttemptControl(claim=stale, session_factory=pg_factory)

    with pytest.raises(FenceLostError):
        async with pg_factory() as session:
            async with session.begin():
                await SqlAlchemyIngestionCheckpointStore(session).save(
                    CheckpointData(
                        run_id=stale.run_id,
                        owner_id=-1,
                        post_id=99,
                        task_id=stale.task_id,
                        group_id=1,
                        next_offset=100,
                    )
                )
                await control.ensure_active_in_session(session)

    async with pg_factory() as session:
        repository = CanonicalExecutionRepository(session)
        assert (
            await SqlAlchemyIngestionCheckpointStore(session).load(
                stale.run_id,
                -1,
                99,
            )
            is None
        )
        assert not await repository.renew(
            execution_id=stale.execution_id,
            attempt_id=stale.attempt_id,
            fencing_token=stale.fencing_token,
            lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
        )
        assert not await repository.complete(
            execution_id=stale.execution_id,
            attempt_id=stale.attempt_id,
            fencing_token=stale.fencing_token,
            processed_items=999,
            total_items=999,
        )
        assert await repository.complete(
            execution_id=current.execution_id,
            attempt_id=current.attempt_id,
            fencing_token=current.fencing_token,
            processed_items=1,
            total_items=1,
        )
        await session.commit()
