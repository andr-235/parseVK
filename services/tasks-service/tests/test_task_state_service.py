from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from app.modules.tasks.exceptions import TaskConflictError
from app.modules.tasks.state_service import TaskStateService


def make_task(status: str, run_id: str = "run-1"):
    return SimpleNamespace(
        id=42,
        title="VK parse",
        description={},
        owner_user_id="user-1",
        status=status,
        execution_run_id=run_id,
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
    )


def make_service(task):
    repository = SimpleNamespace(
        get_task_for_update=AsyncMock(return_value=task),
        add_audit=AsyncMock(),
        touch_task=AsyncMock(return_value=task),
    )
    outbox = SimpleNamespace(add_event=AsyncMock())
    return TaskStateService(AsyncMock(), repository, outbox), repository, outbox


@pytest.mark.anyio
async def test_resume_uses_run_scoped_dedupe_key_and_row_lock():
    service, repository, outbox = make_service(make_task("failed", "run-7"))

    result = await service.resume_task("user-1", 42)

    repository.get_task_for_update.assert_awaited_once_with("user-1", 42)
    assert result["status"] == "pending"
    assert outbox.add_event.await_args.kwargs["dedupe_key"] == "task.resumed:42:run-7"


@pytest.mark.anyio
async def test_resume_rejects_pending_task():
    service, _, _ = make_service(make_task("pending"))

    with pytest.raises(TaskConflictError):
        await service.resume_task("user-1", 42)


@pytest.mark.anyio
async def test_cancel_uses_current_execution_run_in_dedupe_key():
    service, _, outbox = make_service(make_task("running", "run-8"))

    result = await service.cancel_task("user-1", 42)

    assert result["status"] == "cancelled"
    assert outbox.add_event.await_args.kwargs["dedupe_key"] == "task.cancelled:42:run-8"
