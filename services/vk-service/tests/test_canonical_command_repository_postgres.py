from uuid import uuid4

import pytest
from parsevk_contracts.vk.commands import (
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionRequested,
    VkSourceDemandRequest,
)
from sqlalchemy import func, select

from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)
from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)


def _command(*, task_id: int, source_ids: list[tuple[str, object]]):
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
            for external_id, source_id in source_ids
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
        snapshot_sha256="a" * 64,
    )


@pytest.mark.anyio
async def test_task_runs_share_only_matching_physical_sources(db_session):
    source_a = uuid4()
    source_b = uuid4()
    first = _command(task_id=5001, source_ids=[("101", source_a), ("202", source_b)])
    second = _command(task_id=5002, source_ids=[("101", source_a)])
    repository = CanonicalVkCommandRepository(db_session)

    first_result = await repository.attach_command(first)
    second_result = await repository.attach_command(second)

    assert first_result.outcome == "created"
    assert second_result.outcome == "created"
    assert [item.outcome for item in first_result.attachments] == ["created", "created"]
    assert [item.outcome for item in second_result.attachments] == ["coalesced"]
    assert await db_session.scalar(select(func.count(VkTaskRunBinding.id))) == 2
    assert await db_session.scalar(select(func.count(VkSourceCollection.id))) == 2
    assert await db_session.scalar(select(func.count(VkCollectionDemand.id))) == 3
    assert await db_session.scalar(select(func.count(VkExecution.id))) == 2


@pytest.mark.anyio
async def test_duplicate_command_is_idempotent(db_session):
    command = _command(task_id=5003, source_ids=[("303", uuid4())])
    repository = CanonicalVkCommandRepository(db_session)

    first = await repository.attach_command(command)
    duplicate = await repository.attach_command(command)

    assert first.outcome == "created"
    assert duplicate.outcome == "duplicate"
    assert await db_session.scalar(select(func.count(VkTaskRunBinding.id))) == 1
    assert await db_session.scalar(select(func.count(VkCollectionDemand.id))) == 1
