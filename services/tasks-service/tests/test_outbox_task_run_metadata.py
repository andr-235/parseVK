from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.bootstrap import ApplicationFactory
from app.modules.tasks.schemas import CreateParseTaskRequest


@pytest.mark.anyio
async def test_outbox_events_include_frozen_run_metadata():
    service = ApplicationFactory(AsyncMock()).create_tasks_service()
    initial_run_id = str(uuid4())
    task = MagicMock(
        id=42,
        owner_user_id="user-1",
        scope="selected",
        mode="recent_posts",
        group_ids=[1, 2],
        post_limit=10,
        source="manual",
        status="failed",
        execution_run_id=initial_run_id,
        revision=5,
    )
    service.crud.repository.create_task = AsyncMock(return_value=task)
    service.crud.repository.add_audit = AsyncMock()
    service.crud.outbox.add_event = AsyncMock()
    resolver = SimpleNamespace(resolve=AsyncMock())
    service.crud.source_resolver_factory = lambda _session: resolver

    async def freeze_created(_session, frozen_task):
        return {
            "taskRunId": frozen_task.execution_run_id,
            "sourceSetRevision": 5,
            "snapshotSha256": "a" * 64,
        }

    service.crud.freezer = AsyncMock(side_effect=freeze_created)
    service.crud.command_publisher = AsyncMock()
    await service.create_parse_task(
        "user-1",
        CreateParseTaskRequest(
            scope="selected",
            groupIds=[1, 2],
            postLimit=10,
            mode="recent_posts",
        ),
    )

    created = next(
        call
        for call in service.crud.outbox.add_event.await_args_list
        if call.kwargs["event_type"] == "task.created"
    )
    assert created.kwargs["payload"] == {
        "taskId": "42",
        "ownerUserId": "user-1",
        "runId": initial_run_id,
        "scope": "selected",
        "mode": "recent_posts",
        "groupIds": [1, 2],
        "postLimit": 10,
        "source": "manual",
        "taskRunId": initial_run_id,
        "sourceSetRevision": 5,
        "snapshotSha256": "a" * 64,
    }
    resolver.resolve.assert_awaited_once_with(task, [1, 2])
    service.crud.command_publisher.assert_awaited_once()

    service.state.repository.get_task_for_update = AsyncMock(return_value=task)
    service.state.repository.add_audit = AsyncMock()
    service.state.repository.touch_task = AsyncMock(return_value=task)

    async def freeze_resumed(_session, frozen_task, previous_run_id):
        assert previous_run_id == initial_run_id
        return {
            "taskRunId": frozen_task.execution_run_id,
            "sourceSetRevision": 6,
            "snapshotSha256": "b" * 64,
        }

    service.state.freezer = AsyncMock(side_effect=freeze_resumed)
    service.state.command_publisher = AsyncMock()
    await service.resume_task("user-1", 42)

    resumed_run_id = task.execution_run_id
    assert resumed_run_id != initial_run_id
    resumed = next(
        call
        for call in service.state.outbox.add_event.await_args_list
        if call.kwargs["event_type"] == "task.resumed"
    )
    assert resumed.kwargs["dedupe_key"] == f"task.resumed:42:{resumed_run_id}"
    assert resumed.kwargs["payload"]["taskRunId"] == resumed_run_id
    assert resumed.kwargs["payload"]["snapshotSha256"] == "b" * 64
    service.state.command_publisher.assert_awaited_once()
