import asyncio
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import asyncpg
import pytest
from parsevk_contracts.vk.commands import (
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionRequested,
    VkSourceDemandRequest,
)
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from testcontainers.core.container import DockerContainer

from app.domain.entities.provider_account import SYSTEM_VK_CAPABILITY
from app.domain.repositories.checkpoint import CheckpointData
from app.infrastructure.db.base import Base
from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)
from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)
from app.infrastructure.db.repositories.checkpoint import (
    SqlAlchemyIngestionCheckpointStore,
)
from app.infrastructure.db.repositories.provider_accounts import (
    SqlAlchemyProviderAccountRepository,
)
from app.tasks.execution_store import ExecutionStore


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


def _command(
    *,
    task_id: int,
    external_id: str,
    source_id: UUID,
) -> VkExecutionRequested:
    return VkExecutionRequested(
        task_id=task_id,
        task_run_id=uuid4(),
        execution_id=uuid4(),
        owner_user_id=f"user-{task_id}",
        demands=(
            VkSourceDemandRequest(
                demand_id=uuid4(),
                source=SourceReference(
                    source_id=source_id,
                    provider="vk",
                    source_type="community",
                    external_id=external_id,
                    owner_id=-int(external_id),
                ),
            ),
        ),
        post_selection=PostSelection(
            strategy="latestByPublishedAt",
            limit_per_source=10,
        ),
        comment_selection=CommentSelection(
            mode="all",
            include_thread_replies=True,
        ),
        task_revision=1,
        source_set_revision=1,
        snapshot_sha256=f"{task_id:064x}"[-64:],
    )


@pytest.mark.anyio
async def test_concurrent_commands_share_source_and_recover_one_execution():
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

        source_id = uuid4()
        first_command = _command(
            task_id=2870,
            external_id="777",
            source_id=source_id,
        )
        second_command = _command(
            task_id=2871,
            external_id="777",
            source_id=source_id,
        )

        async def attach(command: VkExecutionRequested):
            async with session_factory() as session:
                async with session.begin():
                    return await CanonicalVkCommandRepository(
                        session
                    ).attach_command(command)

        first_result, second_result = await asyncio.gather(
            attach(first_command),
            attach(second_command),
        )
        assert first_result.outcome == "created"
        assert second_result.outcome == "created"
        attachments = (
            first_result.attachments[0],
            second_result.attachments[0],
        )
        assert {attachment.outcome for attachment in attachments} == {
            "created",
            "coalesced",
        }
        assert attachments[0].collection.id == attachments[1].collection.id
        assert attachments[0].execution.id == attachments[1].execution.id

        async with session_factory() as session:
            assert await session.scalar(select(func.count(VkTaskRunBinding.id))) == 2
            assert await session.scalar(select(func.count(VkSourceCollection.id))) == 1
            assert await session.scalar(select(func.count(VkExecution.id))) == 1
            assert await session.scalar(select(func.count(VkCollectionDemand.id))) == 2

        execution_store = ExecutionStore(session_factory)
        first_claim = await execution_store.claim(
            worker_id="worker-before-crash",
            lease_expires_at=datetime.now(UTC) - timedelta(seconds=1),
        )
        assert first_claim is not None

        async with session_factory() as session:
            async with session.begin():
                await SqlAlchemyIngestionCheckpointStore(session).save(
                    CheckpointData(
                        run_id=first_claim.run_id,
                        owner_id=-777,
                        post_id=1,
                        task_id=first_claim.task_id,
                        group_id=777,
                        next_offset=200,
                        processed_comments=200,
                    )
                )

        second_claim = await execution_store.claim(
            worker_id="worker-after-crash",
            lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
        )
        assert second_claim is not None
        assert second_claim.execution_id == first_claim.execution_id
        assert second_claim.fencing_token == first_claim.fencing_token + 1

        async with session_factory() as session:
            checkpoint = await SqlAlchemyIngestionCheckpointStore(session).load(
                second_claim.run_id,
                -777,
                1,
            )
            assert checkpoint is not None
            assert checkpoint.next_offset == 200
            assert checkpoint.processed_comments == 200

        assert not await execution_store.complete(
            execution_id=first_claim.execution_id,
            attempt_id=first_claim.attempt_id,
            fencing_token=first_claim.fencing_token,
            processed_items=999,
            total_items=999,
        )
        assert await execution_store.complete(
            execution_id=second_claim.execution_id,
            attempt_id=second_claim.attempt_id,
            fencing_token=second_claim.fencing_token,
            processed_items=200,
            total_items=200,
            stats={"comments": 200},
        )

        async with session_factory() as session:
            demands = list(
                await session.scalars(
                    select(VkCollectionDemand).order_by(
                        VkCollectionDemand.task_id
                    )
                )
            )
            assert [demand.status for demand in demands] == ["done", "done"]
            terminal_events = list(
                await session.scalars(
                    select(OutboxEvent).where(
                        OutboxEvent.event_type == "task.execution_completed"
                    )
                )
            )
            assert {event.aggregate_id for event in terminal_events} == {
                "2870",
                "2871",
            }

        same_task_first = _command(
            task_id=2872,
            external_id="778",
            source_id=uuid4(),
        )
        same_task_second = _command(
            task_id=2872,
            external_id="779",
            source_id=uuid4(),
        )
        same_task_results = await asyncio.gather(
            attach(same_task_first),
            attach(same_task_second),
        )
        assert {result.outcome for result in same_task_results} == {
            "created",
            "conflict",
        }

        async with session_factory() as session:
            active_for_task = await session.scalar(
                select(func.count(VkTaskRunBinding.id)).where(
                    VkTaskRunBinding.task_id == 2872,
                    VkTaskRunBinding.status.in_(("pending", "running")),
                )
            )
            assert active_for_task == 1
    finally:
        if engine is not None:
            await engine.dispose()
        container.stop()
