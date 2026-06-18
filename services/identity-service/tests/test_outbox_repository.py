import sys
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

from app.db.models import OUTBOX_FAILED, OUTBOX_PENDING, OUTBOX_PUBLISHED, OutboxEvent
from app.modules.outbox import repository
from common.events import EventEnvelope


class FakeScalars:
    def __init__(self, values):
        self.values = values

    def __iter__(self):
        return iter(self.values)


class FakeSession:
    def __init__(self):
        self.added = []
        self.events = {}
        self.statement = None

    def add(self, value):
        self.added.append(value)
        self.events[value.id] = value

    async def flush(self):
        return None

    async def scalars(self, statement):
        self.statement = statement
        return FakeScalars(list(self.events.values()))

    async def get(self, model, event_id):
        return self.events.get(event_id)


@pytest.mark.asyncio
async def test_add_event_stores_payload_and_correlation_id():
    session = FakeSession()
    event = EventEnvelope(
        event_type="identity.user_logged_in",
        producer="identity-service",
        correlation_id="corr-1",
        payload={"user_id": "u1"},
    )

    stored = await repository.add_event(
        session, event, aggregate_type="user", aggregate_id="u1"
    )

    assert stored.id == event.event_id
    assert stored.payload["payload"] == {"user_id": "u1"}
    assert stored.correlation_id == "corr-1"


@pytest.mark.asyncio
async def test_lock_pending_batch_marks_locked_and_uses_statement():
    session = FakeSession()
    event = OutboxEvent(id=uuid4(), event_type="x", aggregate_type="user", aggregate_id="u1")
    event.status = OUTBOX_PENDING
    session.events[event.id] = event

    batch = await repository.lock_pending_batch(session)

    assert batch == [event]
    assert event.locked_at is not None
    assert "FOR UPDATE" in str(session.statement.compile()).upper()


@pytest.mark.asyncio
async def test_mark_published_sets_status():
    session = FakeSession()
    event = OutboxEvent(id=uuid4(), event_type="x", aggregate_type="user", aggregate_id="u1")
    session.events[event.id] = event

    await repository.mark_published(session, event.id)

    assert event.status == OUTBOX_PUBLISHED
    assert event.published_at is not None


@pytest.mark.asyncio
async def test_mark_failed_or_retry_eventually_fails():
    session = FakeSession()
    event = OutboxEvent(id=uuid4(), event_type="x", aggregate_type="user", aggregate_id="u1")
    event.attempts = repository.MAX_OUTBOX_ATTEMPTS - 1
    session.events[event.id] = event

    await repository.mark_failed_or_retry(session, event.id, "boom")

    assert event.status == OUTBOX_FAILED
    assert event.last_error == "boom"
