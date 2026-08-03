import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from common.events import TaskEvent
from common.outbox.models import OutboxMessage

from app.services.task_events_service import TaskEventsService
from app.tasks.outbox_worker import OutboxPublisher


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeOutboxRepository:
    def __init__(self, events=None):
        self.events = events or []
        self.added = []
        self.published = []

    async def add_event(self, **kwargs):
        self.added.append(kwargs)

    async def list_pending(self, *, limit=100):
        return self.events[:limit]

    async def claim_batch(self, limit=100):
        return self.events[:limit]

    async def mark_published(self, event_id):
        self.published.append(event_id)

    async def mark_failed(self, event_id, error):
        return False


class FakeProducer:
    def __init__(self, **kwargs):
        self.kwargs = kwargs
        self.sent = []

    async def send_and_wait(self, topic, *, key, value):
        self.sent.append({"topic": topic, "key": key, "value": value})


class FakeRepository:
    def __init__(self):
        self.processed = set()
        self.executions = []
        self.session = AsyncMock()
        begin_ctx = AsyncMock()
        begin_ctx.__aenter__.return_value = None
        begin_ctx.__aexit__.return_value = None
        self.session.begin = MagicMock(return_value=begin_ctx)

    async def is_processed(self, consumer_name, event_id):
        return (consumer_name, event_id) in self.processed

    async def mark_processed(self, consumer_name, event_id, _event_type):
        self.processed.add((consumer_name, event_id))

    async def get_execution(self, task_id, run_id):
        return next(
            (
                item
                for item in self.executions
                if item.task_id == task_id and item.run_id == run_id
            ),
            None,
        )

    async def get_active_execution(self, task_id):
        return next(
            (
                item
                for item in reversed(self.executions)
                if item.task_id == task_id and item.status in {"pending", "running"}
            ),
            None,
        )

    async def get_latest_execution(self, task_id):
        return next(
            (item for item in reversed(self.executions) if item.task_id == task_id),
            None,
        )

    async def create_execution(self, **kwargs):
        execution = SimpleNamespace(
            id=uuid4(),
            status="pending",
            is_terminal=False,
            **kwargs,
        )
        self.executions.append(execution)
        return execution

    async def request_cancellation(self, **_kwargs):
        return None

    async def fail_pending(self, execution_id, error):
        execution = next(item for item in self.executions if item.id == execution_id)
        execution.status = "failed"
        execution.is_terminal = True
        execution.last_error = error
        return True


class FakeTasksClient:
    def __init__(self):
        self.calls = []

    async def start_execution(self, task_id, run_id, **kwargs):
        self.calls.append(("start", task_id, run_id, kwargs))
        return {"status": "running"}


def task_event(event_type="task.created", task_id=1, event_id=None):
    return TaskEvent.model_validate(
        {
            "event_id": str(event_id or uuid4()),
            "event_type": event_type,
            "event_version": 1,
            "aggregate_id": str(task_id),
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
async def test_crash_before_publish_retains_pending_outbox():
    event_id = uuid4()
    event = OutboxMessage(
        id=event_id,
        event_type="vk.comments_collected",
        event_version=1,
        aggregate_type="vk_comment",
        aggregate_id="-1:2",
        payload={"taskId": 10, "comments": [{"owner_id": -1, "post_id": 2, "id": 3}]},
        correlation_id="corr-1",
        attempts=0,
        created_at=datetime.now(UTC),
    )
    repository = FakeOutboxRepository([event])
    producer = FakeProducer()
    publisher = OutboxPublisher(
        repository=repository,
        producer=producer,
        topic="parsevk.vk.events",
        dlq_topic="parsevk.vk.dlq",
        namespace="vk",
    )

    assert repository.published == []

    published_count = await publisher.publish_batch()

    assert published_count == 1
    assert len(producer.sent) == 1
    sent = producer.sent[0]
    envelope = json.loads(sent["value"].decode("utf-8"))
    assert sent["topic"] == "parsevk.vk.events"
    assert envelope["event_id"] == str(event_id)
    assert envelope["event_type"] == "vk.comments_collected"
    assert repository.published == [event_id]


@pytest.mark.anyio
async def test_duplicate_task_event_creates_one_execution():
    repository = FakeRepository()
    tasks_client = FakeTasksClient()
    handler = TaskEventsService(repository, tasks_client)
    event = task_event()

    assert await handler.handle(event) is not None
    assert await handler.handle(event) is None
    assert len(repository.executions) == 1
    assert len(tasks_client.calls) == 1
    assert (handler.consumer_name, event.event_id) in repository.processed
