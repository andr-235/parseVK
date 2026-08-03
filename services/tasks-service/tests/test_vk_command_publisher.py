"""Boundary tests for canonical VK command publication."""

import sys
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from common.outbox import OutboxMessage
from parsevk_contracts.validation import parse_for_consume
from parsevk_contracts.vk.commands import CATALOG as VK_COMMAND_CATALOG

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
        self.failed = []

    async def claim_batch(self, limit=100):
        return [self.message]

    async def mark_published(self, event_id):
        self.published.append(event_id)

    async def mark_failed(self, event_id, error):
        self.failed.append((event_id, error))
        return False


def command_payload(execution_id, task_run_id):
    source_id = uuid4()
    return {
        "taskId": 42,
        "taskRunId": str(task_run_id),
        "executionId": str(execution_id),
        "ownerUserId": "user-42",
        "demands": [
            {
                "demandId": str(uuid4()),
                "source": {
                    "sourceId": str(source_id),
                    "provider": "vk",
                    "sourceType": "community",
                    "externalId": "777",
                    "ownerId": -777,
                },
            }
        ],
        "postSelection": {
            "strategy": "latestByPublishedAt",
            "limitPerSource": 10,
        },
        "commentSelection": {
            "mode": "all",
            "includeThreadReplies": True,
        },
        "taskRevision": 3,
        "sourceSetRevision": 4,
        "snapshotSha256": "a" * 64,
    }


@pytest.mark.asyncio
async def test_publisher_emits_contract_v2_envelope_and_partition_key():
    execution_id = uuid4()
    message = OutboxMessage(
        id=uuid4(),
        event_type="vk.execution.requested",
        event_version=2,
        aggregate_type="vk_execution",
        aggregate_id=str(execution_id),
        correlation_id=str(execution_id),
        payload=command_payload(execution_id, uuid4()),
        attempts=0,
        created_at=datetime.now(UTC),
    )
    repository = FakeRepository(message)
    producer = AsyncMock()
    config = type(
        "Config",
        (),
        {
            "kafka_topic_tasks": "parsevk.tasks.events",
            "kafka_topic_tasks_dlq": "parsevk.tasks.dlq",
            "kafka_topic_vk_commands": "parsevk.vk.commands",
            "kafka_topic_vk_commands_dlq": "parsevk.vk.commands.dlq",
        },
    )()
    publisher = OutboxPublisher(
        repository=repository,
        producer=producer,
        topic=config.kafka_topic_tasks,
        dlq_topic=config.kafka_topic_tasks_dlq,
        namespace="tasks-test",
        key_fn=lambda item: kafka_key_for_event(
            item.event_type,
            item.payload,
            item.aggregate_id,
        ),
        topic_fn=lambda item: topic_for_event(item, config),
        dlq_topic_fn=lambda item: dlq_topic_for_event(item, config),
    )

    assert await publisher.publish_batch() == 1

    call = producer.send_and_wait.await_args
    assert call.args[0] == "parsevk.vk.commands"
    assert call.kwargs["key"] == str(execution_id).encode()
    parsed = parse_for_consume(
        VK_COMMAND_CATALOG,
        consumer="vk-service",
        topic=call.args[0],
        value=call.kwargs["value"],
    )
    assert parsed.contract.schema_version == 2
    assert parsed.envelope.message_id == message.id
    assert parsed.envelope.correlation_id == execution_id
    assert parsed.envelope.payload.execution_id == execution_id
    assert repository.published == [message.id]
    assert repository.failed == []
