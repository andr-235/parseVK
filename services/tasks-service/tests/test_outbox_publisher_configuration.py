from unittest.mock import AsyncMock

import pytest
from outbox_test_helpers import make_message

from app.modules.outbox.publisher import MAX_OUTBOX_ATTEMPTS, OutboxPublisher


@pytest.mark.anyio
async def test_publisher_does_not_manage_producer_lifecycle():
    repo = AsyncMock()
    repo.claim_batch.return_value = []
    producer = AsyncMock()
    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="parsevk.tasks.events",
        dlq_topic="parsevk.tasks.dlq",
        publish_enabled=False,
    )

    assert await publisher.publish_batch() == 0
    producer.stop.assert_not_called()


@pytest.mark.anyio
async def test_publisher_uses_explicit_topic_name():
    message = make_message("00000000-0000-0000-0000-000000000005")
    repo = AsyncMock()
    repo.claim_batch.return_value = [message]
    producer = AsyncMock()
    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="custom.tasks.events",
        dlq_topic="custom.tasks.dlq",
        publish_enabled=True,
    )

    await publisher.publish_batch()

    assert producer.send_and_wait.call_args.args[0] == "custom.tasks.events"


@pytest.mark.anyio
async def test_publisher_uses_explicit_dlq_topic():
    message = make_message(
        "00000000-0000-0000-0000-000000000006",
        attempts=MAX_OUTBOX_ATTEMPTS - 1,
    )
    repo = AsyncMock()
    repo.claim_batch.return_value = [message]

    async def mark_failed(_event_id, _error):
        message.attempts += 1
        return message.attempts >= MAX_OUTBOX_ATTEMPTS

    repo.mark_failed.side_effect = mark_failed
    producer = AsyncMock()
    sent_topics = []

    async def send(topic, **_kwargs):
        sent_topics.append(topic)
        if topic == "parsevk.tasks.events":
            raise RuntimeError("kafka down")

    producer.send_and_wait.side_effect = send
    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="parsevk.tasks.events",
        dlq_topic="custom.tasks.dlq",
        publish_enabled=True,
    )

    await publisher.publish_batch()

    assert sent_topics == ["parsevk.tasks.events", "custom.tasks.dlq"]
