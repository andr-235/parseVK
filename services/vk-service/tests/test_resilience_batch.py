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

from app.tasks.outbox_worker import OutboxPublisher


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeOutboxRepository:
    def __init__(self, events=None):
        self.events = events or []
        self.published = []

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

    async def send_and_wait(self, topic, *, key, value, headers=None):
        self.sent.append(
            {
                "topic": topic,
                "key": key,
                "value": value,
                "headers": headers,
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
        payload={
            "taskId": 10,
            "comments": [{"owner_id": -1, "post_id": 2, "id": 3}],
        },
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
