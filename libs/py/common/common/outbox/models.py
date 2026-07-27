from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class OutboxMessage:
    id: UUID
    event_type: str
    event_version: int
    aggregate_type: str
    aggregate_id: str
    correlation_id: str | None
    payload: dict
    attempts: int
    created_at: datetime | None
