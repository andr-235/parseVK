import sys
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

from app.db.models import OUTBOX_FAILED, OUTBOX_PUBLISHED, OutboxEvent
from app.modules.outbox.publisher import OutboxPublisher


class FakeProducer:
    def __init__(self, *, fail=False):
        self.fail = fail
        self.calls = []

    async def send_and_wait(self, topic, value, key=None):
        self.calls.append((topic, value, key))
        if self.fail:
            raise RuntimeError("kafka down")


class FakeSession:
    def __init__(self, event):
        self.event = event
        self.committed = False

    async def scalars(self, statement):
        return [self.event]

    async def get(self, model, event_id):
        return self.event if self.event.id == event_id else None

    async def commit(self):
        self.committed = True


def make_event():
    event = OutboxEvent(id=uuid4(), event_type="x", aggregate_type="user", aggregate_id="u1")
    event.payload = {"event_id": str(event.id)}
    event.attempts = 0
    return event


@pytest.mark.asyncio
async def test_publisher_marks_successful_event_published():
    event = make_event()
    producer = FakeProducer()
    session = FakeSession(event)

    published = await OutboxPublisher(producer).publish_once(session)

    assert published == 1
    assert event.status == OUTBOX_PUBLISHED
    assert producer.calls[0][2] == b"u1"
    assert session.committed


@pytest.mark.asyncio
async def test_publisher_marks_failed_event_for_retry():
    event = make_event()
    producer = FakeProducer(fail=True)
    session = FakeSession(event)

    published = await OutboxPublisher(producer).publish_once(session)

    assert published == 0
    assert event.attempts == 1
    assert event.status != OUTBOX_PUBLISHED
    assert session.committed


@pytest.mark.asyncio
async def test_publisher_sets_failed_state_after_max_attempts():
    event = make_event()
    event.attempts = 4
    producer = FakeProducer(fail=True)
    session = FakeSession(event)

    await OutboxPublisher(producer).publish_once(session)

    assert event.status == OUTBOX_FAILED
