import asyncio
import sys
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.background import outbox_worker
from app.modules.outbox.publisher import OutboxPublisher


@pytest.mark.anyio
async def test_repository_lock_pending_sets_locked_at():
    from app.modules.outbox.repository import OutboxRepository

    event = MagicMock()
    event.id = UUID("00000000-0000-0000-0000-000000000007")
    event.locked_at = None
    scalars_result = MagicMock()
    scalars_result.all.return_value = [event]
    session = AsyncMock()
    session.scalars.return_value = scalars_result
    repository = OutboxRepository(session)

    before = datetime.now(UTC)
    rows = await repository.lock_pending(limit=10)

    assert rows == [event]
    assert event.locked_at is not None
    locked_at = event.locked_at
    if locked_at.tzinfo is None:
        locked_at = locked_at.replace(tzinfo=UTC)
    assert locked_at >= before
    session.flush.assert_awaited_once()


@pytest.mark.anyio
async def test_outbox_worker_owns_single_producer_lifecycle(monkeypatch):
    lifecycle = []
    batch_calls = 0

    class FakeContextManager:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        def begin(self):
            return self

    class FakeProducer:
        async def start(self):
            lifecycle.append("start")

        async def stop(self):
            lifecycle.append("stop")

    producer = FakeProducer()

    class FakePublisher:
        async def publish_batch(self):
            nonlocal batch_calls
            batch_calls += 1
            if batch_calls == 2:
                raise asyncio.CancelledError
            return 1

    class FakeFactory:
        producer_instances = []

        def __init__(self, session, *, producer, on_task_complete=None):
            self.producer = producer
            self.__class__.producer_instances.append(producer)

        def create_outbox_publisher(self):
            return FakePublisher()

    class FakeHealth:
        def mark_cycle_success(self):
            return None

        def mark_cycle_error(self, error: str):
            return None

    async def sleep_without_delay(seconds):
        return None

    monkeypatch.setattr(outbox_worker, "SessionLocal", FakeContextManager)
    monkeypatch.setattr(
        outbox_worker,
        "AIOKafkaProducer",
        lambda **kwargs: producer,
    )
    monkeypatch.setattr(outbox_worker, "ApplicationFactory", FakeFactory)
    monkeypatch.setattr(
        outbox_worker.asyncio,
        "sleep",
        sleep_without_delay,
    )

    with pytest.raises(asyncio.CancelledError):
        await outbox_worker.publish_outbox_forever(FakeHealth())

    assert lifecycle == ["start", "stop"]
    assert batch_calls == 2
    assert FakeFactory.producer_instances == [producer, producer]


@pytest.mark.anyio
async def test_publisher_never_manages_producer_lifecycle():
    repository = AsyncMock()
    repository.claim_batch.return_value = []
    producer = AsyncMock()
    publisher = OutboxPublisher(
        repository=repository,
        producer=producer,
        topic="parsevk.tasks.events",
        dlq_topic="parsevk.tasks.dlq",
        publish_enabled=True,
    )

    assert await publisher.publish_batch() == 0
    producer.start.assert_not_called()
    producer.stop.assert_not_called()
