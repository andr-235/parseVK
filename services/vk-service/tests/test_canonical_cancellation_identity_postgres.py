from uuid import uuid4

import pytest
from parsevk_contracts.vk.commands import (
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionRequested,
    VkSourceDemandRequest,
)

from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)


def _command():
    run_id = uuid4()
    return VkExecutionRequested(
        task_id=7101,
        task_run_id=run_id,
        execution_id=uuid4(),
        owner_user_id="user-7101",
        demands=(
            VkSourceDemandRequest(
                demand_id=uuid4(),
                source=SourceReference(
                    source_id=uuid4(),
                    provider="vk",
                    source_type="community",
                    external_id="501",
                    owner_id=-501,
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
        snapshot_sha256="d" * 64,
    )


@pytest.mark.anyio
async def test_cancellation_requires_matching_execution_and_owner(db_session):
    command = _command()
    repository = CanonicalVkCommandRepository(db_session)
    await repository.attach_command(command)

    wrong_execution = await repository.request_cancellation(
        task_id=command.task_id,
        run_id=str(command.task_run_id),
        execution_id=uuid4(),
        owner_user_id=command.owner_user_id,
        reason="cancel",
    )
    wrong_owner = await repository.request_cancellation(
        task_id=command.task_id,
        run_id=str(command.task_run_id),
        execution_id=command.execution_id,
        owner_user_id="other-user",
        reason="cancel",
    )
    accepted = await repository.request_cancellation(
        task_id=command.task_id,
        run_id=str(command.task_run_id),
        execution_id=command.execution_id,
        owner_user_id=command.owner_user_id,
        reason="cancel",
    )

    assert wrong_execution is None
    assert wrong_owner is None
    assert accepted is not None
    assert accepted.status == "cancelled"
