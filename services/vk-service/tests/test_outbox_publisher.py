import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from common.outbox.models import OutboxMessage

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


@pytest.mark.anyio
async def test_outbox_publisher_sends_event_and_marks_published():
    event_id = uuid4()
    event = OutboxMessage(
        id=event_id,
        event_type="vk.comment_collected",
        event_version=1,
        aggregate_type="vk_comment",
        aggregate_id="-1:2:3",
        correlation_id="corr-1",
        payload={"taskId": 10, "comment": {"id": 3}},
        attempts=0,
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
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

    published_count = await publisher.publish_batch()

    sent = producer.sent[0]
    envelope = json.loads(sent["value"].decode("utf-8"))
    assert published_count == 1
    assert sent["topic"] == "parsevk.vk.events"
    assert sent["key"] == b"-1:2:3"
    assert envelope["event_id"] == str(event_id)
    assert envelope["event_type"] == "vk.comment_collected"
    assert envelope["payload"]["comment"]["id"] == 3
    assert repository.published == [event_id]
