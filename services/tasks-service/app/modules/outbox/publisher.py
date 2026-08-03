"""Outbox publisher adapters and routing for tasks-service."""

from __future__ import annotations

from uuid import UUID

from common.outbox import OutboxMessage, OutboxPublisher

from app.db.models import OutboxEvent
from app.modules.outbox.repository import OutboxRepository as TasksOutboxRepository

__all__ = [
    "OutboxPublisher",
    "TasksOutboxRepositoryAdapter",
    "kafka_key_for_event",
    "topic_for_event",
    "dlq_topic_for_event",
    "MAX_OUTBOX_ATTEMPTS",
]

MAX_OUTBOX_ATTEMPTS = 5
VK_EXECUTION_REQUESTED = "vk.execution.requested"


def kafka_key_for_event(event_type: str, payload: dict, aggregate_id: str) -> str:
    if event_type == "task.automation_settings_updated":
        return str(payload["ownerUserId"])
    if event_type == VK_EXECUTION_REQUESTED:
        return str(payload["executionId"])
    return str(payload.get("taskId") or aggregate_id)


def topic_for_event(message: OutboxMessage, settings) -> str:
    if message.event_type == VK_EXECUTION_REQUESTED:
        return settings.kafka_topic_vk_commands
    return settings.kafka_topic_tasks


def dlq_topic_for_event(message: OutboxMessage, settings) -> str:
    if message.event_type == VK_EXECUTION_REQUESTED:
        return settings.kafka_topic_vk_commands_dlq
    return settings.kafka_topic_tasks_dlq


class TasksOutboxRepositoryAdapter:
    """Adapts tasks-service OutboxRepository to common OutboxRepository protocol."""

    def __init__(self, inner: TasksOutboxRepository):
        self._inner = inner

    async def claim_batch(self, limit: int = 100) -> list[OutboxMessage]:
        events = await self._inner.lock_pending(limit=limit)
        return [_to_message(e) for e in events]

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
