from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field

from common.events.types import ImEventType, TaskEventType, VkEventType


class EventEnvelope(BaseModel):
    event_id: UUID = Field(default_factory=uuid4)
    event_type: str
    event_version: int = 1
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    producer: str
    correlation_id: str | None = None
    payload: dict[str, Any]

    def to_json_bytes(self) -> bytes:
        return self.model_dump_json().encode("utf-8")


class WireEvent(BaseModel):
    event_id: UUID
    event_type: str
    event_version: int
    aggregate_type: str
    aggregate_id: str
    correlation_id: str | None = None
    payload: dict[str, Any]
    created_at: str

    model_config = ConfigDict(extra="ignore")


class ConsumerEvent(BaseModel):
    event_id: UUID
    event_type: str
    event_version: int
    aggregate_id: str
    correlation_id: str | None = None
    payload: dict[str, Any]


class TaskEvent(ConsumerEvent):
    event_type: TaskEventType


class VkEvent(ConsumerEvent):
    event_type: VkEventType


class ImEvent(ConsumerEvent):
    event_type: ImEventType
