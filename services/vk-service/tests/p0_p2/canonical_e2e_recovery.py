from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select

from app.domain.entities.provider_account import SYSTEM_VK_CAPABILITY
from app.domain.repositories.checkpoint import CheckpointData
from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)
from app.infrastructure.db.repositories.canonical_executions import (
    CanonicalExecutionRepository,
)
from app.infrastructure.db.repositories.checkpoint import (
    SqlAlchemyIngestionCheckpointStore,
)
from app.infrastructure.db.repositories.provider_accounts import (
    SqlAlchemyProviderAccountRepository,
)


async def run_crash_recovery(sessions, metadata) -> None:
    owner_id = int(metadata["sourceOwnerId"])
    group_id = abs(owner_id)
    task_id = int(metadata["taskId"])
    async with sessions() as session, session.begin():
        await SqlAlchemyProviderAccountRepository(session).upsert_system(
            account_key="system-vk",
            provider="vk",
            credential_version="version-e2e",
            capabilities=[SYSTEM_VK_CAPABILITY],
        )
        stale = await CanonicalExecutionRepository(session).claim_next(
            worker_id="e2e-worker-before-crash",
            lease_expires_at=datetime.now(UTC) - timedelta(seconds=1),
        )
        assert stale is not None
        await SqlAlchemyIngestionCheckpointStore(session).save(
            CheckpointData(
                run_id=stale.run_id,
                owner_id=owner_id,
                post_id=10,
                task_id=task_id,
                group_id=group_id,
                next_offset=200,
                processed_comments=200,
                status="in_progress",
            )
        )

    async with sessions() as session, session.begin():
        current = await CanonicalExecutionRepository(session).claim_next(
            worker_id="e2e-worker-after-crash",
            lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
        )
    assert current is not None
    assert current.execution_id == stale.execution_id
    assert current.attempt_number == stale.attempt_number + 1

    async with sessions() as session, session.begin():
        repository = CanonicalExecutionRepository(session)
        checkpoint = await SqlAlchemyIngestionCheckpointStore(session).load(
            current.run_id,
            owner_id,
            10,
        )
        assert checkpoint is not None
        assert checkpoint.next_offset == 200
        assert checkpoint.processed_comments == 200
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
            processed_items=250,
            total_items=250,
        )

    async with sessions() as session:
        binding = await session.scalar(
            select(VkTaskRunBinding).where(
                VkTaskRunBinding.command_execution_id
                == metadata["executionId"]
            )
        )
        execution = await session.get(VkExecution, current.execution_id)
        demand = await session.scalar(
            select(VkCollectionDemand).where(
                VkCollectionDemand.demand_id == metadata["demandId"]
            )
        )
        collection = await session.scalar(
            select(VkSourceCollection).where(
                VkSourceCollection.execution_id == current.execution_id
            )
        )
        terminal_count = await session.scalar(
            select(func.count(OutboxEvent.id)).where(
                OutboxEvent.event_type == "task.execution_completed",
                OutboxEvent.aggregate_id == str(task_id),
            )
        )

    assert binding is not None and binding.status == "done"
    assert execution is not None and execution.status == "done"
    assert demand is not None and demand.status == "done"
    assert collection is not None and collection.status == "done"
    assert terminal_count == 1
