import sys
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.tasks.events import TaskEvent
from app.modules.tasks.service import TaskEventsHandler


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeRepository:
    def __init__(self):
        self.processed = set()
        self.runs = {}
        self.saved = 0

    async def is_processed(self, consumer_name, event_id):
        return (consumer_name, event_id) in self.processed

    async def mark_processed(self, consumer_name, event_id, event_type):
        self.processed.add((consumer_name, event_id))

    async def get_task_run(self, task_id):
        return self.runs.get(task_id)

    async def create_task_run(self, event, run_id):
        run = FakeTaskRun(
            task_id=event.task_id(),
            run_id=run_id,
            status="pending",
        )
        self.runs[event.task_id()] = run
        return run

    async def save(self):
        self.saved += 1


class FakeTaskRun:
    def __init__(self, task_id, run_id, status):
        self.task_id = task_id
        self.run_id = run_id
        self.status = status
        self.started_at = None
        self.finished_at = None
        self.updated_at = None


class FakeTasksClient:
    def __init__(self):
        self.calls = []

    async def start_execution(self, task_id, run_id, **kwargs):
        self.calls.append(("start", task_id, run_id, kwargs))
        return {"status": "running"}


def event(event_type="task.created", task_id=1, event_id=None):
    return TaskEvent.model_validate(
        {
            "event_id": str(event_id or uuid4()),
            "event_type": event_type,
            "event_version": 1,
            "aggregate_id": str(task_id),
            "correlation_id": "corr-1",
            "payload": {
                "taskId": str(task_id),
                "ownerUserId": "user-1",
                "scope": "selected",
                "mode": "recent_posts",
                "groupIds": [1],
                "postLimit": 10,
            },
        }
    )


@pytest.mark.anyio
async def test_created_event_calls_start_execution():
    repository = FakeRepository()
    tasks_client = FakeTasksClient()
    handler = TaskEventsHandler(repository, tasks_client)
    task_event = event()

    result = await handler.handle(task_event)

    assert result.status == "running"
    assert tasks_client.calls == [
        ("start", 1, str(task_event.event_id), {"request_id": str(task_event.event_id), "correlation_id": "corr-1"})
    ]


@pytest.mark.anyio
async def test_duplicate_event_does_not_call_tasks_client_twice():
    repository = FakeRepository()
    tasks_client = FakeTasksClient()
    handler = TaskEventsHandler(repository, tasks_client)
    task_event = event()

    await handler.handle(task_event)
    duplicate = await handler.handle(task_event)

    assert duplicate is None
    assert len(tasks_client.calls) == 1


@pytest.mark.anyio
async def test_deleted_event_marks_run_cancelled():
    repository = FakeRepository()
    repository.runs[1] = FakeTaskRun(task_id=1, run_id="run-1", status="running")
    tasks_client = FakeTasksClient()
    handler = TaskEventsHandler(repository, tasks_client)

    result = await handler.handle(event(event_type="task.deleted", task_id=1))

    assert result.status == "cancelled"
    assert repository.runs[1].status == "cancelled"
    assert tasks_client.calls == []


def test_missing_task_id_is_validation_safe():
    task_event = TaskEvent.model_validate(
        {
            "event_id": str(uuid4()),
            "event_type": "task.created",
            "event_version": 1,
            "aggregate_id": "1",
            "payload": {},
        }
    )

    with pytest.raises(KeyError) as error:
        task_event.task_id()

    assert "taskId" in str(error.value)
