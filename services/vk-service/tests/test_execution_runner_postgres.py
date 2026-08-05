import asyncio
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import asyncpg
import pytest
from _canonical_runtime_helpers import make_command
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from testcontainers.core.container import DockerContainer

from app.domain.entities.provider_account import SYSTEM_VK_CAPABILITY
from app.domain.repositories.checkpoint import CheckpointData
from app.infrastructure.db.base import Base
from app.infrastructure.db.models.executions import VkExecutionAttempt
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)
from app.infrastructure.db.repositories.checkpoint import (
    SqlAlchemyIngestionCheckpointStore,
)
from app.infrastructure.db.repositories.provider_accounts import (
    SqlAlchemyProviderAccountRepository,
)
from app.services.ingestion.result import IngestionResult
from app.tasks.execution_control import ExecutionAttemptControl
from app.tasks.execution_runner import ExecutionAttemptRunner
from app.tasks.execution_store import ExecutionStore


class SimulatedWorkerCrash(RuntimeError):
    pass


class FakeVkAdapter:
    def __init__(self):
        self.requests = 0

    async def get_groups(self, group_ids, fields=None):
        self.requests += 1
        await asyncio.sleep(0)
        return [{"id": group_ids[0]}]


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
        except (OSError, asyncpg.PostgresError) as exc:
            last_error = exc
            await asyncio.sleep(0.1)
    raise RuntimeError("PostgreSQL test container did not become ready") from last_error


@pytest.mark.anyio
async def test_postgres_runner_heartbeats_and_recovers_after_committed_page(
    monkeypatch,
):
    recovery_observations = []
    monkeypatch.setattr(
        "app.tasks.execution_store.observe_attempt_started",
        lambda *, recovered: recovery_observations.append(recovered),
    )
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

        async with session_factory() as session:
            async with session.begin():
                await SqlAlchemyProviderAccountRepository(session).upsert_system(
                    account_key="system-vk",
                    provider="vk",
                    credential_version="version-1",
                    capabilities=[SYSTEM_VK_CAPABILITY],
                )
                command = make_command(
                    task_id=2860,
                    source_id=uuid4(),
                    external_id=1,
                )
                attachment = await CanonicalVkCommandRepository(
                    session
                ).attach_command(command)
                assert attachment.outcome == "created"

        execution_store = ExecutionStore(session_factory)
        first = await execution_store.claim(
            worker_id="worker-before-crash",
            lease_expires_at=datetime.now(UTC) + timedelta(seconds=2),
        )
        assert first is not None
        first_adapter = FakeVkAdapter()

        class CrashAfterPageCommitService:
            def __init__(self, session, adapter, attempt_control):
                self.session = session
                self.adapter = adapter
                self.attempt_control = attempt_control

            async def execute(self, claim, *, correlation_id=None):
                await self.adapter.get_groups([1])
                checkpoint_store = SqlAlchemyIngestionCheckpointStore(self.session)
                await checkpoint_store.save(
                    CheckpointData(
                        run_id=claim.run_id,
                        owner_id=-1,
                        post_id=10,
                        task_id=claim.task_id,
                        group_id=1,
                        next_offset=200,
                        processed_comments=200,
                    )
                )
                await self.attempt_control.ensure_active_in_session(self.session)
                await self.session.commit()

                await asyncio.sleep(0.15)
                raise SimulatedWorkerCrash("crash after committed page")

        first_runner = ExecutionAttemptRunner(
            execution_store=execution_store,
            session_factory=session_factory,
            ingestion_factory=lambda session, adapter, attempt_control: (
                CrashAfterPageCommitService(session, adapter, attempt_control)
            ),
            lease_seconds=2,
            heartbeat_seconds=0.03,
            timeout_seconds=2,
            adapter_factory=lambda _session, _claim: first_adapter,
        )
        first_control = ExecutionAttemptControl(
            claim=first,
            session_factory=session_factory,
        )

        with pytest.raises(SimulatedWorkerCrash, match="after committed page"):
            await first_runner.run(first, first_control)

        assert first_adapter.requests == 1
        async with session_factory() as session:
            first_attempt = await session.get(VkExecutionAttempt, first.attempt_id)
            assert first_attempt is not None
            assert first_attempt.heartbeat_at > first_attempt.started_at

        async with session_factory() as session:
            async with session.begin():
                first_attempt = await session.get(
                    VkExecutionAttempt,
                    first.attempt_id,
                    with_for_update=True,
                )
                assert first_attempt is not None
                first_attempt.lease_expires_at = datetime.now(UTC) - timedelta(
                    seconds=1
                )

        second = await execution_store.claim(
            worker_id="worker-after-crash",
            lease_expires_at=datetime.now(UTC) + timedelta(seconds=2),
        )
        assert second is not None
        assert second.execution_id == first.execution_id
        assert second.fencing_token == first.fencing_token + 1
        assert recovery_observations == [False, True]

        second_adapter = FakeVkAdapter()

        class ResumeFromCheckpointService:
            def __init__(self, session, adapter):
                self.session = session
                self.adapter = adapter

            async def execute(self, claim, *, correlation_id=None):
                checkpoint = await SqlAlchemyIngestionCheckpointStore(
                    self.session
                ).load(claim.run_id, -1, 10)
                assert checkpoint is not None
                assert checkpoint.next_offset == 200
                assert checkpoint.processed_comments == 200
                await self.adapter.get_groups([1])
                return IngestionResult(comments=50)

        second_runner = ExecutionAttemptRunner(
            execution_store=execution_store,
            session_factory=session_factory,
            ingestion_factory=lambda session, adapter, attempt_control: (
                ResumeFromCheckpointService(session, adapter)
            ),
            lease_seconds=2,
            heartbeat_seconds=0.03,
            timeout_seconds=2,
            adapter_factory=lambda _session, _claim: second_adapter,
        )
        second_control = ExecutionAttemptControl(
            claim=second,
            session_factory=session_factory,
        )
        result = await second_runner.run(second, second_control)

        assert result.processed_items == 50
        assert second_adapter.requests == 1
        assert not await execution_store.complete(
            execution_id=first.execution_id,
            attempt_id=first.attempt_id,
            fencing_token=first.fencing_token,
            processed_items=999,
            total_items=999,
        )
        assert await execution_store.complete(
            execution_id=second.execution_id,
            attempt_id=second.attempt_id,
            fencing_token=second.fencing_token,
            processed_items=result.processed_items,
            total_items=result.processed_items,
            stats=result.stats(),
        )

        async with session_factory() as session:
            terminal_events = (
                await session.scalars(
                    select(OutboxEvent).where(
                        OutboxEvent.event_type == "task.execution_completed",
                        OutboxEvent.aggregate_id == "2860",
                    )
                )
            ).all()
            assert len(terminal_events) == 1
    finally:
        if engine is not None:
            await engine.dispose()
        container.stop()
