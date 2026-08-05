from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import pytest
from parsevk_contracts.vk.commands import (
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionRequested,
    VkSourceDemandRequest,
)
from sqlalchemy import func, select

from app.domain.entities.provider_account import SYSTEM_VK_CAPABILITY
from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)
from app.infrastructure.db.repositories.canonical_cancellation import (
    CanonicalCancellationRepository,
)
from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)
from app.infrastructure.db.repositories.executions import (
    SqlAlchemyExecutionRepository,
)
from app.infrastructure.db.repositories.provider_accounts import (
    SqlAlchemyProviderAccountRepository,
)


def _command(
    *,
    task_id: int,
    external_id: str,
    source_id: UUID,
    post_limit: int = 10,
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
            limit_per_source=post_limit,
        ),
        comment_selection=CommentSelection(
            mode="all",
            include_thread_replies=True,
        ),
        task_revision=1,
        source_set_revision=1,
        snapshot_sha256="9" * 64,
    )


async def _seed_account(db_session) -> None:
    await SqlAlchemyProviderAccountRepository(db_session).upsert_system(
        account_key="system-vk",
        provider="vk",
        credential_version="version-1",
        capabilities=[SYSTEM_VK_CAPABILITY],
    )


@pytest.mark.anyio
async def test_plan_mismatch_does_not_coalesce(db_session):
    source_id = uuid4()
    repository = CanonicalVkCommandRepository(db_session)

    first = await repository.attach_command(
        _command(
            task_id=8001,
            external_id="801",
            source_id=source_id,
            post_limit=10,
        )
    )
    second = await repository.attach_command(
        _command(
            task_id=8002,
            external_id="801",
            source_id=source_id,
            post_limit=20,
        )
    )

    assert first.attachments[0].outcome == "created"
    assert second.attachments[0].outcome == "created"
    assert first.attachments[0].collection.id != second.attachments[0].collection.id
    assert await db_session.scalar(select(func.count(VkSourceCollection.id))) == 2
    assert await db_session.scalar(select(func.count(VkExecution.id))) == 2


@pytest.mark.anyio
async def test_late_join_marks_new_binding_started(db_session):
    await _seed_account(db_session)
    source_id = uuid4()
    commands = CanonicalVkCommandRepository(db_session)
    first_command = _command(
        task_id=8003,
        external_id="802",
        source_id=source_id,
    )
    first = await commands.attach_command(first_command)
    execution_repository = SqlAlchemyExecutionRepository(db_session)
    claim = await execution_repository.claim_next(
        worker_id="worker-late-join",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )
    assert claim is not None

    second_command = _command(
        task_id=8004,
        external_id="802",
        source_id=source_id,
    )
    second = await commands.attach_command(second_command)

    assert second.attachments[0].outcome == "coalesced"
    assert second.attachments[0].collection.id == first.attachments[0].collection.id
    assert second.attachments[0].demand.status == "running"
    binding = await db_session.get(VkTaskRunBinding, second.binding.id)
    assert binding.status == "running"
    started = list(
        await db_session.scalars(
            select(OutboxEvent)
            .where(OutboxEvent.event_type == "task.execution_started")
            .order_by(OutboxEvent.aggregate_id)
        )
    )
    assert {event.aggregate_id for event in started} == {"8003", "8004"}


@pytest.mark.anyio
async def test_shared_failure_terminalizes_each_binding_once(db_session):
    await _seed_account(db_session)
    source_id = uuid4()
    commands = CanonicalVkCommandRepository(db_session)
    first = await commands.attach_command(
        _command(task_id=8005, external_id="803", source_id=source_id)
    )
    second = await commands.attach_command(
        _command(task_id=8006, external_id="803", source_id=source_id)
    )
    repository = SqlAlchemyExecutionRepository(db_session)
    claim = await repository.claim_next(
        worker_id="worker-shared-failure",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )
    assert claim is not None

    assert await repository.fail(
        execution_id=claim.execution_id,
        attempt_id=claim.attempt_id,
        fencing_token=claim.fencing_token,
        error="shared source failed",
    )

    first_binding = await db_session.get(VkTaskRunBinding, first.binding.id)
    second_binding = await db_session.get(VkTaskRunBinding, second.binding.id)
    assert first_binding.status == "failed"
    assert second_binding.status == "failed"
    terminal = list(
        await db_session.scalars(
            select(OutboxEvent).where(
                OutboxEvent.event_type == "task.execution_failed"
            )
        )
    )
    assert {event.aggregate_id for event in terminal} == {"8005", "8006"}


@pytest.mark.anyio
async def test_last_cancelled_binding_stops_pending_collection(db_session):
    source_id = uuid4()
    commands = CanonicalVkCommandRepository(db_session)
    first_command = _command(
        task_id=8007,
        external_id="804",
        source_id=source_id,
    )
    second_command = _command(
        task_id=8008,
        external_id="804",
        source_id=source_id,
    )
    first = await commands.attach_command(first_command)
    await commands.attach_command(second_command)
    cancellations = CanonicalCancellationRepository(db_session)

    await cancellations.request_cancellation(
        task_id=first_command.task_id,
        run_id=str(first_command.task_run_id),
        execution_id=first_command.execution_id,
        owner_user_id=first_command.owner_user_id,
        reason="cancel first",
    )
    await cancellations.request_cancellation(
        task_id=second_command.task_id,
        run_id=str(second_command.task_run_id),
        execution_id=second_command.execution_id,
        owner_user_id=second_command.owner_user_id,
        reason="cancel second",
    )

    collection = await db_session.get(
        VkSourceCollection,
        first.attachments[0].collection.id,
    )
    execution = await db_session.get(VkExecution, collection.execution_id)
    demands = list(
        await db_session.scalars(
            select(VkCollectionDemand).where(
                VkCollectionDemand.collection_id == collection.id
            )
        )
    )
    assert collection.status == "cancelled"
    assert execution.status == "cancelled"
    assert {demand.status for demand in demands} == {"cancelled"}
