import json
import sys
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.domain.events.task_event_mapper import TaskEventMapper
from app.services.task_events_service import TaskEventsService
from common.events import TaskEvent


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

    async def create_task_run(
        self,
        task_id: int,
        owner_user_id: str,
        run_id: str,
        scope: str,
        mode: str,
        group_ids: list[int],
        post_limit: int | None = None,
    ):
        run = FakeTaskRun(
            task_id=task_id,
            run_id=run_id,
            status="pending",
        )
        self.runs[task_id] = run
        return run

    async def update_task_run(self, task_id, **kwargs):
        run = self.runs.get(task_id)
        if run is not None:
            for key, value in kwargs.items():
                setattr(run, key, value)
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
        self.last_error = None


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
async def test_created_event_is_queued_without_inline_execution():
    repository = FakeRepository()
    handler = TaskEventsService(repository)
    task_event = event()

    result = await handler.handle(task_event)

    assert result.status == "pending"
    assert result.run_id == str(task_event.event_id)
    assert repository.saved == 1


@pytest.mark.anyio
async def test_duplicate_event_does_not_call_tasks_client_twice():
    repository = FakeRepository()
    handler = TaskEventsService(repository)
    task_event = event()

    await handler.handle(task_event)
    duplicate = await handler.handle(task_event)

    assert duplicate is None
    assert repository.saved == 1


@pytest.mark.anyio
async def test_deleted_event_marks_run_cancelled():
    repository = FakeRepository()
    repository.runs[1] = FakeTaskRun(task_id=1, run_id="run-1", status="running")
    handler = TaskEventsService(repository)

    result = await handler.handle(event(event_type="task.deleted", task_id=1))

    assert result.status == "cancelled"
    assert repository.runs[1].status == "cancelled"


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
        TaskEventMapper.get_task_id(task_event)

    assert "taskId" in str(error.value)


@pytest.mark.anyio
async def test_completed_task_event_does_not_move_lifecycle_backward():
    repository = FakeRepository()
    repository.runs[1] = FakeTaskRun(task_id=1, run_id="run-1", status="done")
    handler = TaskEventsService(repository)

    result = await handler.handle(event(task_id=1))

    assert result is None
    assert repository.runs[1].status == "done"


@pytest.mark.anyio
async def test_running_task_event_same_run_id_returns_none_preventing_reexecution():
    repository = FakeRepository()
    task_event = event(task_id=1)
    repository.runs[1] = FakeTaskRun(task_id=1, run_id=str(task_event.event_id), status="running")
    handler = TaskEventsService(repository)

    result = await handler._handle_created_or_resumed(task_event)

    assert result is None


@pytest.mark.anyio
async def test_handle_processing_failure_sends_to_dlq_on_malformed_msg():
    from unittest.mock import AsyncMock, patch

    from app.tasks.kafka_consumer import TaskEventsConsumer

    consumer = TaskEventsConsumer(session_factory=AsyncMock())
    consumer._consumer = AsyncMock()

    msg = AsyncMock()
    msg.value = b"not valid json{{{"
    msg.offset = 42

    with patch("common.kafka.consumer.send_to_dlq", new_callable=AsyncMock) as mock_send:
        await consumer._handle_processing_failure(msg)
        mock_send.assert_awaited_once()

    consumer._consumer.commit.assert_awaited_once()


@pytest.mark.anyio
async def test_skip_exhausted_event_commits_offset():
    from datetime import UTC, datetime, timedelta
    from types import SimpleNamespace
    from unittest.mock import AsyncMock, patch
    from uuid import uuid4

    from app.tasks.kafka_consumer import TaskEventsConsumer

    consumer = TaskEventsConsumer(session_factory=AsyncMock())
    consumer._consumer = AsyncMock()

    raw_value = json.dumps(
        {
            "event_id": str(uuid4()),
            "event_type": "task.created",
        }
    ).encode()

    row = SimpleNamespace(
        next_retry_at=datetime.now(UTC) + timedelta(hours=1),
        retry_count=3,
    )

    async def scalar_mock(*a, **kw):
        return row

    session = AsyncMock()
    session.scalar = scalar_mock
    session.__aenter__ = AsyncMock(return_value=session)

    consumer.session_factory = lambda: session

    with patch("common.kafka.consumer.send_to_dlq", new_callable=AsyncMock) as send_to_dlq:
        result = await consumer._skip_due_to_retry_backoff(raw_value)

    assert result is True
    send_to_dlq.assert_awaited_once()
    consumer._consumer.commit.assert_awaited_once()


@pytest.mark.anyio
async def test_resumed_event_requeues_failed_run_with_new_run_id():
    repository = FakeRepository()
    repository.runs[1] = FakeTaskRun(task_id=1, run_id="old-run", status="failed")
    handler = TaskEventsService(repository)

    task_event = event(event_type="task.resumed", task_id=1)
    result = await handler.handle(task_event)

    assert result.status == "pending"
    assert result.run_id == str(task_event.event_id)
    assert result.attempts == 0
