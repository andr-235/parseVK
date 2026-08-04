from unittest.mock import AsyncMock

import pytest

from app.modules.outbox.publisher import MAX_OUTBOX_ATTEMPTS, OutboxPublisher
from outbox_test_helpers import make_message


def make_publisher(repo, producer):
    return OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="parsevk.tasks.events",
        dlq_topic="parsevk.tasks.dlq",
        publish_enabled=True,
    )


@pytest.mark.anyio
async def test_publish_batch_marks_published_on_success():
    message = make_message("00000000-0000-0000-0000-000000000001")
    repo = AsyncMock()
    repo.claim_batch.return_value = [message]
    producer = AsyncMock()

    assert await make_publisher(repo, producer).publish_batch() == 1

    repo.mark_published.assert_awaited_once_with(message.id)


@pytest.mark.anyio
async def test_publish_batch_marks_failed_on_error():
    message = make_message(
        "00000000-0000-0000-0000-000000000002",
        attempts=3,
    )
    repo = AsyncMock()
    repo.claim_batch.return_value = [message]
    repo.mark_failed.return_value = False
    producer = AsyncMock()
    producer.send_and_wait.side_effect = RuntimeError("kafka down")

    assert await make_publisher(repo, producer).publish_batch() == 1

    repo.mark_failed.assert_awaited_once_with(message.id, "kafka down")
    repo.mark_published.assert_not_awaited()


@pytest.mark.anyio
async def test_publish_batch_sends_to_dlq_after_max_attempts():
    message = make_message(
        "00000000-0000-0000-0000-000000000003",
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

    assert await make_publisher(repo, producer).publish_batch() == 1
    assert sent_topics == ["parsevk.tasks.events", "parsevk.tasks.dlq"]


@pytest.mark.anyio
async def test_publish_batch_skips_dlq_below_max_attempts():
    message = make_message(
        "00000000-0000-0000-0000-000000000004",
        attempts=1,
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
        raise RuntimeError("kafka down")

    producer.send_and_wait.side_effect = send

    assert await make_publisher(repo, producer).publish_batch() == 1
    assert sent_topics == ["parsevk.tasks.events"]
