import logging
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


@pytest.mark.anyio
async def test_transport_retries_malformed_json_then_pauses():
    handler = AsyncMock()
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
    )
    consumer._consumer = kafka
    consumer._decode = MagicMock(side_effect=ValueError("invalid json"))
    message = AsyncMock(value=b"{", offset=8, partition=0)

    assert await consumer.process_message(message) is False
    assert consumer._decode.call_count == 2
    handler.handle.assert_not_awaited()
    kafka.commit.assert_not_awaited()
    kafka.pause.assert_called_once_with("partition")
    assert consumer.healthy is False


@pytest.mark.anyio
async def test_transport_logs_correlation_id_for_invalid_event(caplog):
    class InvalidEventModel:
        @classmethod
        def model_validate(cls, payload):
            raise ValueError("invalid event")

    kafka = AsyncMock()
    kafka.assignment = MagicMock(return_value={"partition"})
    kafka.pause = MagicMock()
    consumer = KafkaProjectionConsumer(
        topic="topic",
        group_id="group",
        event_model=InvalidEventModel,
        handler_factory=lambda session: AsyncMock(),
        session_factory=lambda: Session(),
        max_attempts=1,
        backoff_seconds=0,
    )
    consumer._consumer = kafka
    message = AsyncMock(
        value=b'{"event_id":"event-1","event_type":"vk.post_collected",'
        b'"correlation_id":"corr-1"}',
        offset=9,
        partition=0,
    )

    with caplog.at_level(logging.ERROR):
        assert await consumer.process_message(message) is False

    assert "correlation_id=corr-1" in caplog.text
    kafka.commit.assert_not_awaited()
