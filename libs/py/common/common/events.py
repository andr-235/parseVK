<<<<<<< HEAD
from datetime import datetime, timezone
=======
from datetime import UTC, datetime
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class EventEnvelope(BaseModel):
    event_id: UUID = Field(default_factory=uuid4)
    event_type: str
    event_version: int = 1
<<<<<<< HEAD
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
=======
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
    producer: str
    correlation_id: str | None = None
    payload: dict[str, Any]

    def to_json_bytes(self) -> bytes:
        return self.model_dump_json().encode("utf-8")
