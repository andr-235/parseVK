from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class OutboxEvent:
    id: UUID
    event_type: str
    event_version: int
    aggregate_type: str
    aggregate_id: str
    correlation_id: str | None
    dedupe_key: str | None
    payload: dict
    status: str
    attempts: int
    next_attempt_at: datetime
    locked_at: datetime | None
    published_at: datetime | None
    last_error: str | None
    created_at: datetime
