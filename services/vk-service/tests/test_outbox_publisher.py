import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.services.domain_events_service import OutboxService
from app.tasks.outbox_worker import OutboxPublisher


class FakeOutboxRepository:
    def __init__(self, events=None):
        self.events = events or []
        self.added = []
        self.published = []

    async def add_event(self, **kwargs):
        self.added.append(kwargs)

    async def list_pending(self, *, limit=100):
        return self.events[:limit]

    async def lock_pending_batch(self, limit=100):
        return self.events[:limit]

    async def mark_published(self, event_id):
        self.published.append(event_id)

    async def mark_failed_or_retry(self, event_id, error):
        return False


class FakeProducer:
    instances = []

    def __init__(self, **kwargs):
        self.kwargs = kwargs
        self.started = False
        self.sent = []
        FakeProducer.instances.append(self)

    async def start(self):
        self.started = True

    async def stop(self):
        self.started = False

    async def send_and_wait(self, topic, *, key, value):
        self.sent.append({"topic": topic, "key": key, "value": value})


@pytest.mark.anyio
async def test_comment_outbox_event_contains_projection_payload():
    repository = FakeOutboxRepository()
    service = OutboxService(repository)

    await service.emit_comment_collected(
        {"owner_id": -1, "post_id": 2, "id": 3, "text": "comment"},
        task_id=10,
        correlation_id="corr-1",
    )

    event = repository.added[0]
    assert event["event_type"] == "vk.comment_collected"
    assert event["dedupe_key"] == "vk.comment_collected:-1:2:3"
    assert event["payload"]["vkOwnerId"] == -1
    assert event["payload"]["vkPostId"] == 2
    assert event["payload"]["vkCommentId"] == 3
    assert event["payload"]["comment"]["text"] == "comment"


@pytest.mark.anyio
async def test_outbox_publisher_sends_event_and_marks_published():
    event_id = uuid4()
    event = SimpleNamespace(
        id=event_id,
        event_type="vk.comment_collected",
        event_version=1,
        aggregate_type="vk_comment",
        aggregate_id="-1:2:3",
        correlation_id="corr-1",
        payload={"taskId": 10, "comment": {"id": 3}},
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
    )
    repository = FakeOutboxRepository([event])
    publisher = OutboxPublisher(repository, topic="parsevk.vk.events", producer_factory=FakeProducer)

    published_count = await publisher.publish_pending()
    await publisher.stop()

    producer = FakeProducer.instances[-1]
    sent = producer.sent[0]
    envelope = json.loads(sent["value"].decode("utf-8"))
    assert published_count == 1
    assert sent["topic"] == "parsevk.vk.events"
    assert sent["key"] == b"-1:2:3"
    assert envelope["event_id"] == str(event_id)
    assert envelope["event_type"] == "vk.comment_collected"
    assert envelope["payload"]["comment"]["id"] == 3
    assert repository.published == [event_id]
