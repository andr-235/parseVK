from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from common.events import TaskEvent

from app.services.task_events_service import TaskEventsService


@pytest.mark.anyio
async def test_resumed_event_requeues_cancelled_run():
    run = SimpleNamespace(
        task_id=1,
        run_id="run-1",
        status="cancelled",
        finished_at=object(),
        last_error="cancelled",
        execution_sequence=5,
        attempts=2,
    )
    repository = SimpleNamespace(
        get_task_run=AsyncMock(return_value=run),
        update_task_run=AsyncMock(return_value=run),
    )
    service = TaskEventsService(repository, AsyncMock())
    event = TaskEvent.model_validate(
        {
            "event_id": "11111111-1111-1111-1111-111111111111",
            "event_type": "task.resumed",
            "event_version": 1,
            "aggregate_id": "1",
            "payload": {
                "taskId": "1",
                "ownerUserId": "user-1",
                "runId": "run-1",
                "scope": "selected",
                "mode": "recent_posts",
                "groupIds": [1],
                "postLimit": 10,
            },
        }
    )

    await service._handle_created_or_resumed(event)

    repository.update_task_run.assert_awaited_once()
    task_id = repository.update_task_run.await_args.args[0]
    values = repository.update_task_run.await_args.kwargs
    assert task_id == 1
    assert values["run_id"] == "run-1"
    assert values["status"] == "pending"
    assert values["finished_at"] is None
    assert values["last_error"] is None
    assert values["execution_sequence"] == 0
    assert values["attempts"] == 0
    assert values["updated_at"] is not None
