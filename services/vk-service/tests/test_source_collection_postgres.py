import asyncio
from datetime import UTC, datetime, timedelta

import asyncpg
import pytest
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
)
from app.infrastructure.db.repositories.checkpoint import (
    SqlAlchemyIngestionCheckpointStore,
)
from app.infrastructure.db.repositories.provider_accounts import (
    SqlAlchemyProviderAccountRepository,
)
from app.infrastructure.db.repositories.source_collections import (
    SqlAlchemySourceCollectionRepository,
)
from app.services.collection_fingerprint import build_collection_identity
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


@pytest.mark.anyio
async def test_concurrent_demands_share_collection_and_recover_one_execution():
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

        identity = build_collection_identity(
            provider_account_key="system-vk",
            scope="selected",
            mode="recent_posts",
            group_ids=[777],
            post_limit=10,
            payload={},
        )

        async def attach(task_id: int, run_id: str):
            async with session_factory() as session:
                async with session.begin():
                    return await SqlAlchemySourceCollectionRepository(
                        session
                    ).attach_demand(
                        task_id=task_id,
                        owner_user_id=f"user-{task_id}",
                        run_id=run_id,
                        provider_account_key=identity.provider_account_key,
                        source_key=identity.source_key,
                        fingerprint=identity.fingerprint,
                        scope="selected",
                        mode="recent_posts",
                        group_ids=[777],
                        post_limit=10,
                        plan_snapshot=identity.normalized_plan,
                    )

        first_attachment, second_attachment = await asyncio.gather(
            attach(2870, "run-2870"),
            attach(2871, "run-2871"),
        )
        assert first_attachment is not None
        assert second_attachment is not None
        assert first_attachment.collection.id == second_attachment.collection.id
        assert first_attachment.execution.id == second_attachment.execution.id

        async with session_factory() as session:
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
            demands = (
                await session.scalars(
                    select(VkCollectionDemand).order_by(VkCollectionDemand.task_id)
                )
            ).all()
            assert [demand.status for demand in demands] == ["done", "done"]
            terminal_events = (
                await session.scalars(
                    select(OutboxEvent).where(
                        OutboxEvent.event_type == "task.execution_completed"
                    )
                )
            ).all()
            assert {event.aggregate_id for event in terminal_events} == {
                "2870",
                "2871",
            }
    finally:
        if engine is not None:
            await engine.dispose()
        container.stop()
