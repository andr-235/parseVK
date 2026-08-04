from datetime import UTC, datetime
from unittest.mock import MagicMock
from uuid import UUID

from common.outbox.models import OutboxMessage


def make_event(event_id: str, attempts: int = 0, status: str = "pending"):
    event = MagicMock()
    event.id = UUID(event_id)
    event.event_type = "task.created"
    event.event_version = 1
    event.aggregate_type = "task"
    event.aggregate_id = "42"
    event.correlation_id = None
    event.dedupe_key = None
    event.payload = {"taskId": "42", "ownerUserId": "u1"}
    event.status = status
    event.attempts = attempts
    event.locked_at = None
    event.published_at = None
    event.last_error = None
    event.created_at = datetime.now(UTC)
    return event


def make_message(event_id: str, attempts: int = 0) -> OutboxMessage:
    return OutboxMessage(
        id=UUID(event_id),
        event_type="task.created",
        event_version=1,
        aggregate_type="task",
        aggregate_id="42",
        correlation_id=None,
        payload={"taskId": "42", "ownerUserId": "u1"},
        attempts=attempts,
        created_at=datetime.now(UTC),
    )
