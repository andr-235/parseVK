from unittest.mock import AsyncMock, MagicMock

import pytest
from app.infrastructure.messaging.consumer import KafkaProjectionConsumer


class EventModel:
    @classmethod
    def model_validate(cls, payload):
        return payload


class Transaction:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return None


class Session:
    def begin(self):
        return Transaction()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return None


@pytest.mark.anyio
async def test_transport_commits_only_after_success():
    handler = AsyncMock()
    kafka = AsyncMock()
    consumer = KafkaProjectionConsumer(
        topic="topic",
        group_id="group",
        event_model=EventModel,
        handler_factory=lambda session: handler,
        session_factory=lambda: Session(),
        max_attempts=2,
        backoff_seconds=0,
    )
    consumer._consumer = kafka
    message = AsyncMock(value=b'{"event_id":"1"}', offset=7, partition=0)

    await consumer.process_message(message)

    handler.handle.assert_awaited_once()
    kafka.commit.assert_awaited_once()


@pytest.mark.anyio
async def test_transport_pauses_poison_message_without_commit():
    handler = AsyncMock()
    handler.handle.side_effect = RuntimeError("boom")
    kafka = AsyncMock()
    kafka.assignment = MagicMock(return_value={"partition"})
    kafka.pause = MagicMock()
    consumer = KafkaProjectionConsumer(
        topic="topic",
        group_id="group",
        event_model=EventModel,
        handler_factory=lambda session: handler,
        session_factory=lambda: Session(),
        max_attempts=2,
        backoff_seconds=0,
        poison_policy="pause",
    )
    consumer._consumer = kafka
    message = AsyncMock(value=b'{"event_id":"1"}', offset=7, partition=0)

    assert await consumer.process_message(message) is False
    assert handler.handle.await_count == 2
    kafka.commit.assert_not_awaited()
    kafka.pause.assert_called_once_with("partition")
    assert consumer.healthy is False
