"""Boundary tests for canonical VK cancellation publication."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from common.outbox import OutboxMessage
from parsevk_contracts.validation import parse_for_consume
from parsevk_contracts.vk.commands import CATALOG as VK_COMMAND_CATALOG
from parsevk_contracts.vk.commands import VkExecutionCancelRequested

from app.modules.outbox.publisher import (
    OutboxPublisher,
    dlq_topic_for_event,
    kafka_key_for_event,
    topic_for_event,
)


class FakeRepository:
    def __init__(self, message):
        self.message = message
        self.published = []

    async def claim_batch(self, limit=100):
        return [self.message]

    async def mark_published(self, event_id):
        self.published.append(event_id)

    async def mark_failed(self, event_id, error):
        raise AssertionError((event_id, error))


def config():
    return type(
        "Config",
        (),
        {
            "kafka_topic_tasks": "parsevk.tasks.events",
            "kafka_topic_tasks_dlq": "parsevk.tasks.dlq",
            "kafka_topic_vk_commands": "parsevk.vk.commands",
            "kafka_topic_vk_commands_dlq": "parsevk.vk.commands.dlq",
        },
    )()


@pytest.mark.asyncio
async def test_cancel_uses_canonical_topic_key_and_envelope():
    execution_id = uuid4()
    task_run_id = uuid4()
    payload = VkExecutionCancelRequested(
        task_id=42,
        task_run_id=task_run_id,
        execution_id=execution_id,
        owner_user_id="user-42",
        reason="task.cancelled",
    )
    message = OutboxMessage(
        id=uuid4(),
        event_type="vk.execution.cancel_requested",
        event_version=1,
        aggregate_type="vk_execution",
        aggregate_id=str(execution_id),
        correlation_id=str(execution_id),
        payload=payload.to_wire(),
        attempts=0,
        created_at=datetime.now(UTC),
    )
    repository = FakeRepository(message)
    producer = AsyncMock()
    settings = config()
    publisher = OutboxPublisher(
        repository=repository,
        producer=producer,
        topic=settings.kafka_topic_tasks,
        dlq_topic=settings.kafka_topic_tasks_dlq,
        namespace="tasks-test",
        key_fn=lambda item: kafka_key_for_event(
            item.event_type,
            item.payload,
            item.aggregate_id,
        ),
        topic_fn=lambda item: topic_for_event(item, settings),
        dlq_topic_fn=lambda item: dlq_topic_for_event(item, settings),
    )

    assert await publisher.publish_batch() == 1

    call = producer.send_and_wait.await_args
    assert call.args[0] == settings.kafka_topic_vk_commands
    assert call.kwargs["key"] == str(execution_id).encode()
    parsed = parse_for_consume(
        VK_COMMAND_CATALOG,
        consumer="vk-service",
        topic=call.args[0],
        value=call.kwargs["value"],
    )
    assert isinstance(parsed.envelope.payload, VkExecutionCancelRequested)
    assert parsed.envelope.payload.execution_id == execution_id
    assert "schemaVersion" not in parsed.envelope.to_wire()
    assert repository.published == [message.id]
