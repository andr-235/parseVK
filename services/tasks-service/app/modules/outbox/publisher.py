"""Outbox publisher adapters and routing for tasks-service."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from common.outbox import OutboxMessage
from common.outbox import OutboxPublisher as CommonOutboxPublisher
from parsevk_contracts.validation import prepare_for_publish
from parsevk_contracts.vk.commands import CATALOG as VK_COMMAND_CATALOG
from parsevk_contracts.vk.commands import (
    VkExecutionCancelRequested,
    VkExecutionRequested,
)

from app.db.models import OutboxEvent
from app.modules.outbox.repository import OutboxRepository as TasksOutboxRepository

__all__ = [
    "MAX_OUTBOX_ATTEMPTS",
    "OutboxPublisher",
    "TasksOutboxRepositoryAdapter",
    "dlq_topic_for_event",
    "kafka_key_for_event",
    "topic_for_event",
]

MAX_OUTBOX_ATTEMPTS = 5
VK_EXECUTION_REQUESTED = "vk.execution.requested"
VK_EXECUTION_CANCEL_REQUESTED = "vk.execution.cancel_requested"
VK_COMMAND_TYPES = frozenset(
    {VK_EXECUTION_REQUESTED, VK_EXECUTION_CANCEL_REQUESTED}
)


def kafka_key_for_event(
    event_type: str,
    payload: dict,
    aggregate_id: str,
) -> str:
    if event_type == "task.automation_settings_updated":
        return str(payload["ownerUserId"])
    if event_type in VK_COMMAND_TYPES:
        return str(payload["executionId"])
    return str(payload.get("taskId") or aggregate_id)


def topic_for_event(message: OutboxMessage, settings) -> str:
    if message.event_type in VK_COMMAND_TYPES:
        return settings.kafka_topic_vk_commands
    return settings.kafka_topic_tasks


def dlq_topic_for_event(message: OutboxMessage, settings) -> str:
    if message.event_type in VK_COMMAND_TYPES:
        return settings.kafka_topic_vk_commands_dlq
    return settings.kafka_topic_tasks_dlq


def _as_utc(value: datetime | None) -> datetime:
    if value is None:
        return datetime.now(UTC)
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _command_model(event_type: str, payload: dict):
    if event_type == VK_EXECUTION_REQUESTED:
        return VkExecutionRequested.model_validate(payload)
    if event_type == VK_EXECUTION_CANCEL_REQUESTED:
        return VkExecutionCancelRequested.model_validate(payload)
    raise ValueError(f"Unsupported VK command type: {event_type}")


class OutboxPublisher(CommonOutboxPublisher):
    """Publish ordinary task events and strict canonical VK commands."""

    async def _publish_event(self, event: OutboxMessage) -> None:
        if event.event_type not in VK_COMMAND_TYPES:
            await super()._publish_event(event)
            return

        command = _command_model(event.event_type, event.payload)
        if not event.correlation_id:
            raise ValueError(
                f"{event.event_type} outbox row requires correlation_id"
            )
        correlation_id = UUID(str(event.correlation_id))
        if correlation_id != command.execution_id:
            raise ValueError(
                f"{event.event_type} correlation_id must equal executionId"
            )
        if str(event.aggregate_id) != str(command.execution_id):
            raise ValueError(
                f"{event.event_type} aggregate_id must equal executionId"
            )

        prepared = prepare_for_publish(
            VK_COMMAND_CATALOG,
            message_type=event.event_type,
            producer="tasks-service",
            message_id=event.id,
            occurred_at=_as_utc(event.created_at),
            correlation_id=correlation_id,
            causation_id=None,
            payload=command.model_dump(mode="python"),
        )
        if prepared.topic != self._topic_for(event):
            raise ValueError(
                "configured VK command topic does not match contract catalog"
            )
        key = prepared.partition_key or str(command.execution_id)
        await self.producer.send_and_wait(
            prepared.topic,
            key=key.encode("utf-8"),
            value=prepared.value,
            headers=list(prepared.headers),
        )


class TasksOutboxRepositoryAdapter:
    def __init__(self, inner: TasksOutboxRepository):
        self._inner = inner

    async def claim_batch(self, limit: int = 100) -> list[OutboxMessage]:
        events = await self._inner.lock_pending(limit=limit)
        return [_to_message(event) for event in events]

    async def mark_published(self, event_id: UUID) -> None:
        event = await self._inner.get(event_id)
        if event is not None:
            await self._inner.mark_published(event)

    async def mark_failed(self, event_id: UUID, error: str) -> bool:
        event = await self._inner.get(event_id)
        if event is None:
            return False
        await self._inner.mark_failed(
            event,
            error,
            max_attempts=MAX_OUTBOX_ATTEMPTS,
        )
        return event.attempts >= MAX_OUTBOX_ATTEMPTS


def _to_message(event: OutboxEvent) -> OutboxMessage:
    return OutboxMessage(
        id=event.id,
        event_type=event.event_type,
        event_version=event.event_version,
        aggregate_type=event.aggregate_type,
        aggregate_id=event.aggregate_id,
        correlation_id=event.correlation_id,
        payload=event.payload,
        attempts=event.attempts,
        created_at=event.created_at,
    )
