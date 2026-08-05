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
from sqlalchemy import select

from app.domain.entities.provider_account import SYSTEM_VK_CAPABILITY
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.source_collections import VkTaskRunBinding
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


def _command(*, task_id: int, sources: list[tuple[str, UUID]]):
    run_id = uuid4()
    return VkExecutionRequested(
        task_id=task_id,
        task_run_id=run_id,
        execution_id=uuid4(),
        owner_user_id=f"user-{task_id}",
        demands=tuple(
            VkSourceDemandRequest(
                demand_id=uuid4(),
                source=SourceReference(
                    source_id=source_id,
                    provider="vk",
                    source_type="community",
                    external_id=external_id,
                    owner_id=-int(external_id),
                ),
            )
            for external_id, source_id in sources
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
        snapshot_sha256="b" * 64,
    )


async def _seed_account(db_session):
    await SqlAlchemyProviderAccountRepository(db_session).upsert_system(
        account_key="system-vk",
        provider="vk",
        credential_version="version-1",
        capabilities=[SYSTEM_VK_CAPABILITY],
    )


@pytest.mark.anyio
async def test_binding_completes_only_after_all_sources(db_session):
    await _seed_account(db_session)
    command = _command(
        task_id=6001,
        sources=[("101", uuid4()), ("202", uuid4())],
    )
    attached = await CanonicalVkCommandRepository(db_session).attach_command(command)
    repository = SqlAlchemyExecutionRepository(db_session)

    first = await repository.claim_next(
        worker_id="worker-1",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )
    assert first is not None
    assert await repository.complete(
        execution_id=first.execution_id,
        attempt_id=first.attempt_id,
        fencing_token=first.fencing_token,
        processed_items=4,
        total_items=4,
        stats={"comments": 4},
    )

    binding = await db_session.get(VkTaskRunBinding, attached.binding.id)
    assert binding.status == "running"
    assert not list(
        await db_session.scalars(
            select(OutboxEvent).where(
                OutboxEvent.event_type == "task.execution_completed"
            )
        )
    )

    second = await repository.claim_next(
        worker_id="worker-2",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )
    assert second is not None
    assert second.execution_id != first.execution_id
    assert await repository.complete(
        execution_id=second.execution_id,
        attempt_id=second.attempt_id,
        fencing_token=second.fencing_token,
        processed_items=6,
        total_items=6,
        stats={"comments": 6},
    )

    binding = await db_session.get(VkTaskRunBinding, attached.binding.id)
    assert binding.status == "done"
    assert binding.processed_items == 10
    assert binding.total_items == 10
    assert binding.stats == {"comments": 10}
    terminal = list(
        await db_session.scalars(
            select(OutboxEvent).where(
                OutboxEvent.event_type == "task.execution_completed"
            )
        )
    )
    assert len(terminal) == 1


@pytest.mark.anyio
async def test_cancelling_one_binding_keeps_shared_source_running(db_session):
    source = uuid4()
    first_command = _command(task_id=6002, sources=[("303", source)])
    second_command = _command(task_id=6003, sources=[("303", source)])
    commands = CanonicalVkCommandRepository(db_session)
    first = await commands.attach_command(first_command)
    second = await commands.attach_command(second_command)

    cancelled = await CanonicalCancellationRepository(
        db_session
    ).request_cancellation(
        task_id=first_command.task_id,
        run_id=str(first_command.task_run_id),
        execution_id=first_command.execution_id,
        owner_user_id=first_command.owner_user_id,
        reason="user cancelled",
    )

    assert cancelled is not None
    assert cancelled.status == "cancelled"
    second_binding = await db_session.get(VkTaskRunBinding, second.binding.id)
    assert second_binding.status == "pending"
    assert first.attachments[0].collection.id == second.attachments[0].collection.id
