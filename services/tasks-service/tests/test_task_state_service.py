from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import UUID, uuid4

import pytest

from app.modules.tasks.exceptions import TaskConflictError
from app.modules.tasks.state_service import TaskStateService


def make_task(status: str, run_id: str | None = None, revision: int = 3):
    return SimpleNamespace(
        id=42,
        title="VK parse",
        description={},
        owner_user_id="user-1",
        status=status,
        execution_run_id=run_id or str(uuid4()),
        updated_at=datetime.now(UTC),
        error="old error",
        scope="selected",
        mode="recent_posts",
        group_ids=[1],
        post_limit=10,
        source="manual",
        total_items=0,
        processed_items=0,
        progress=0,
        stats=None,
        skipped_groups_message=None,
        created_at=datetime.now(UTC),
        revision=revision,
    )


def make_service(task):
    repository = SimpleNamespace(
        get_task_for_update=AsyncMock(return_value=task),
        add_audit=AsyncMock(),
        touch_task=AsyncMock(return_value=task),
    )
    outbox = SimpleNamespace(add_event=AsyncMock())

    async def freezer(session, frozen_task, previous_run_id):
        return {
            "taskRunId": frozen_task.execution_run_id,
            "taskRevision": frozen_task.revision,
            "sourceSetRevision": frozen_task.revision,
            "snapshotSha256": "a" * 64,
        }

    command_publisher = AsyncMock()
    cancellation_publisher = AsyncMock()
    service = TaskStateService(
        AsyncMock(),
        repository,
        outbox,
        freezer=freezer,
        command_publisher=command_publisher,
        cancellation_publisher=cancellation_publisher,
    )
    return (
        service,
        repository,
        outbox,
        command_publisher,
        cancellation_publisher,
    )


@pytest.mark.anyio
async def test_resume_creates_child_run_scoped_event_key_and_row_lock():
    previous_run_id = str(uuid4())
    task = make_task("failed", previous_run_id)
    service, repository, outbox, command_publisher, _ = make_service(task)

    result = await service.resume_task("user-1", 42)

    repository.get_task_for_update.assert_awaited_once_with("user-1", 42)
    assert result["status"] == "pending"
    new_run_id = task.execution_run_id
    assert new_run_id != previous_run_id
    UUID(new_run_id)

    resumed_call = next(
        call
        for call in outbox.add_event.await_args_list
        if call.kwargs["event_type"] == "task.resumed"
    )
    assert resumed_call.kwargs["payload"]["runId"] == new_run_id
    assert resumed_call.kwargs["dedupe_key"] == (
        f"task.resumed:42:{new_run_id}"
    )
    changed_call = next(
        call
        for call in outbox.add_event.await_args_list
        if call.kwargs["event_type"] == "task.state_changed"
    )
    assert changed_call.kwargs["dedupe_key"] == (
        f"task.state_changed:42:resumed:{task.revision}"
    )
    command_publisher.assert_awaited_once()
    run_meta = command_publisher.await_args.args[3]
    assert run_meta["taskRunId"] == new_run_id


@pytest.mark.anyio
async def test_resume_rejects_pending_task():
    service, _, _, _, _ = make_service(make_task("pending"))

    with pytest.raises(TaskConflictError):
        await service.resume_task("user-1", 42)


@pytest.mark.anyio
async def test_cancel_uses_current_execution_run_in_both_commands():
    run_id = str(uuid4())
    task = make_task("running", run_id)
    service, _, outbox, _, cancellation_publisher = make_service(task)

    result = await service.cancel_task("user-1", 42)

    assert result["status"] == "cancelled"
    cancelled_call = next(
        call
        for call in outbox.add_event.await_args_list
        if call.kwargs["event_type"] == "task.cancelled"
    )
    assert cancelled_call.kwargs["dedupe_key"] == (
        f"task.cancelled:42:{run_id}"
    )
    assert cancelled_call.kwargs["payload"]["runId"] == run_id
    changed_call = next(
        call
        for call in outbox.add_event.await_args_list
        if call.kwargs["event_type"] == "task.state_changed"
    )
    assert changed_call.kwargs["dedupe_key"] == (
        f"task.state_changed:42:cancelled:{task.revision}"
    )
    cancellation_publisher.assert_awaited_once()
    assert cancellation_publisher.await_args.args[2] is task
