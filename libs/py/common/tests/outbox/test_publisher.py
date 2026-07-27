from __future__ import annotations

import json
from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest
from common.outbox import OutboxMessage, OutboxPublisher


class FakeRepository:
    def __init__(self, events: list[OutboxMessage] | None = None):
        self.events = events or []
        self.published: list[UUID] = []
        self.failed: list[tuple[UUID, str]] = []
        self.fail_return = False

    async def claim_batch(self, limit: int = 100) -> list[OutboxMessage]:
        return self.events[:limit]

    async def mark_published(self, event_id: UUID) -> None:
        self.published.append(event_id)

    async def mark_failed(self, event_id: UUID, error: str) -> bool:
        self.failed.append((event_id, error))
        return self.fail_return


class FakeProducer:
    def __init__(self):
        self.sent: list[dict] = []

    async def send_and_wait(self, topic, *, key, value):
        self.sent.append({"topic": topic, "key": key, "value": value})


def _message(event_id: UUID | None = None) -> OutboxMessage:
    return OutboxMessage(
        id=event_id or uuid4(),
        event_type="test.event",
        event_version=1,
        aggregate_type="test",
        aggregate_id="agg-1",
        correlation_id="corr-1",
        payload={"taskId": 42},
        attempts=0,
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
    )


@pytest.mark.anyio
async def test_publish_disabled_returns_zero():
    repo = FakeRepository()
    producer = FakeProducer()
    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="events",
        dlq_topic="dlq",
        publish_enabled=False,
    )

    result = await publisher.publish_batch()

    assert result == 0
    assert repo.published == []
    assert producer.sent == []


@pytest.mark.anyio
async def test_publish_batch_sends_wire_event_and_marks_published():
    message = _message()
    repo = FakeRepository([message])
    producer = FakeProducer()
    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="events",
        dlq_topic="dlq",
    )

    result = await publisher.publish_batch()

    assert result == 1
    assert repo.published == [message.id]
    assert len(producer.sent) == 1
    sent = producer.sent[0]
    assert sent["topic"] == "events"
    assert sent["key"] == b"agg-1"
    envelope = json.loads(sent["value"].decode("utf-8"))
    assert envelope["event_id"] == str(message.id)
    assert envelope["event_type"] == "test.event"
    assert envelope["aggregate_id"] == "agg-1"


@pytest.mark.anyio
async def test_publish_error_calls_mark_failed_and_sends_dlq_when_maxed():
    message = _message()
    repo = FakeRepository([message])
    repo.fail_return = True
    producer = FakeProducer()

    async def fail_on_events(topic, *, key, value):
        producer.sent.append({"topic": topic, "key": key, "value": value})
        if topic == "events":
            raise RuntimeError("kafka down")

    producer.send_and_wait = fail_on_events
    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="events",
        dlq_topic="dlq",
        namespace="test",
    )

    result = await publisher.publish_batch()

    assert result == 1
    assert repo.published == []
    assert len(repo.failed) == 1
    assert repo.failed[0] == (message.id, "kafka down")
    assert len(producer.sent) == 2
    assert producer.sent[0]["topic"] == "events"
    assert producer.sent[1]["topic"] == "dlq"
    dlq_envelope = json.loads(producer.sent[1]["value"].decode("utf-8"))
    assert dlq_envelope["event_id"] == str(message.id)
    assert dlq_envelope["dlq_reason"].startswith("max_retries_exceeded")


@pytest.mark.anyio
async def test_key_fn_customizes_partition_key():
    message = _message()
    repo = FakeRepository([message])
    producer = FakeProducer()
    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="events",
        dlq_topic="dlq",
        key_fn=lambda msg: str(msg.payload["taskId"]),
    )

    await publisher.publish_batch()

    assert producer.sent[0]["key"] == b"42"
