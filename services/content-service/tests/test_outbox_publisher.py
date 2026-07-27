import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID

from common.outbox.models import OutboxMessage

from app.modules.outbox.publisher import (
    ContentOutboxRepositoryAdapter,
    OutboxPublisher,
    kafka_key_for_event,
)


def _make_message(
    event_id: str = "00000000-0000-0000-0000-000000000001",
    event_type: str = "content.comments_projected",
    aggregate_id: str = "-1:3",
    attempts: int = 0,
):
    return OutboxMessage(
        id=UUID(event_id),
        event_type=event_type,
        event_version=1,
        aggregate_type="vk_comment",
        aggregate_id=aggregate_id,
        correlation_id=None,
        payload={"insertedCount": 2, "totalCount": 2, "postKey": aggregate_id},
        attempts=attempts,
        created_at=datetime.now(UTC),
    )


def test_kafka_key_for_comments_projected_uses_post_key():
    assert kafka_key_for_event(
        "content.comments_projected",
        {"postKey": "-1:3"},
        "other",
    ) == "-1:3"


def test_kafka_key_for_unknown_event_uses_aggregate_id():
    assert kafka_key_for_event("content.unknown", {}, "agg-1") == "agg-1"


@pytest.mark.anyio
async def test_adapter_claim_batch_maps_to_messages():
    inner = AsyncMock()
    event = MagicMock()
    event.id = UUID("00000000-0000-0000-0000-000000000001")
    event.event_type = "content.comments_projected"
    event.event_version = 1
    event.aggregate_type = "vk_comment"
    event.aggregate_id = "-1:3"
    event.correlation_id = None
    event.payload = {"insertedCount": 1}
    event.attempts = 0
    event.created_at = datetime.now(UTC)
    inner.lock_pending.return_value = [event]

    adapter = ContentOutboxRepositoryAdapter(inner)
    messages = await adapter.claim_batch(limit=10)

    assert len(messages) == 1
    assert messages[0].event_type == "content.comments_projected"
    inner.lock_pending.assert_awaited_once_with(limit=10)


@pytest.mark.anyio
async def test_adapter_mark_published_ignores_missing_event():
    inner = AsyncMock()
    inner.get.return_value = None
    adapter = ContentOutboxRepositoryAdapter(inner)

    await adapter.mark_published(UUID("00000000-0000-0000-0000-000000000001"))

    inner.get.assert_awaited_once()
    inner.mark_published.assert_not_awaited()


@pytest.mark.anyio
async def test_publish_batch_calls_mark_published_on_success():
    repo = AsyncMock()
    repo.claim_batch.return_value = [_make_message()]
    producer = AsyncMock()

    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="parsevk.content.events",
        dlq_topic="parsevk.content.dlq",
        namespace="content",
        key_fn=lambda msg: kafka_key_for_event(msg.event_type, msg.payload, msg.aggregate_id),
    )
    result = await publisher.publish_batch()

    assert result == 1
    repo.mark_published.assert_awaited_once_with(UUID("00000000-0000-0000-0000-000000000001"))
    producer.send_and_wait.assert_awaited_once()
    topic = producer.send_and_wait.await_args.args[0]
    assert topic == "parsevk.content.events"


@pytest.mark.anyio
async def test_publish_batch_calls_mark_failed_on_error():
    repo = AsyncMock()
    repo.claim_batch.return_value = [_make_message(attempts=3)]
    repo.mark_failed.return_value = False
    producer = AsyncMock()
    producer.send_and_wait = AsyncMock(side_effect=RuntimeError("kafka down"))

    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="parsevk.content.events",
        dlq_topic="parsevk.content.dlq",
        namespace="content",
    )
    result = await publisher.publish_batch()

    assert result == 1
    repo.mark_failed.assert_awaited_once()
    repo.mark_published.assert_not_awaited()


@pytest.mark.anyio
async def test_publish_batch_sends_to_dlq_after_max_attempts():
    from app.modules.outbox.publisher import MAX_OUTBOX_ATTEMPTS

    repo = AsyncMock()
    repo.claim_batch.return_value = [_make_message(attempts=4)]
    repo.mark_failed.return_value = True
    producer = AsyncMock()
    producer.send_and_wait = AsyncMock(side_effect=[RuntimeError("kafka down"), None])

    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="parsevk.content.events",
        dlq_topic="parsevk.content.dlq",
        namespace="content",
    )
    result = await publisher.publish_batch()

    assert result == 1
    assert producer.send_and_wait.await_count == 2
    calls = producer.send_and_wait.await_args_list
    assert calls[1].args[0] == "parsevk.content.dlq"
    repo.mark_failed.assert_awaited_once()
