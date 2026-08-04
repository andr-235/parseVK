from uuid import uuid4

import pytest
from parsevk_contracts.vk.commands import (
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionRequested,
    VkSourceDemandRequest,
)
from sqlalchemy import select

from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)


def _command(task_id: int, external_id: str):
    return VkExecutionRequested(
        task_id=task_id,
        task_run_id=uuid4(),
        execution_id=uuid4(),
        owner_user_id=f"user-{task_id}",
        demands=(
            VkSourceDemandRequest(
                demand_id=uuid4(),
                source=SourceReference(
                    source_id=uuid4(),
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
        snapshot_sha256="c" * 64,
    )


@pytest.mark.anyio
async def test_new_run_for_active_task_is_rejected_durably(db_session):
    repository = CanonicalVkCommandRepository(db_session)
    first = _command(7001, "401")
    second = _command(7001, "402")

    assert (await repository.attach_command(first)).outcome == "created"
    conflict = await repository.attach_command(second)
    assert conflict.outcome == "conflict"
    assert conflict.reason

    await repository.emit_rejection(second, conflict.reason)
    event = await db_session.scalar(
        select(OutboxEvent).where(
            OutboxEvent.event_type == "task.execution_failed",
            OutboxEvent.dedupe_key
            == f"task.execution_failed:rejected:{second.execution_id}",
        )
    )
    assert event is not None
    assert event.payload["failureKind"] == "rejected"
    assert event.payload["runId"] == str(second.task_run_id)
