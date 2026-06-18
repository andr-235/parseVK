from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TaskEvent(BaseModel):
    event_id: UUID
    event_type: Literal["task.created", "task.resumed", "task.deleted"]
    event_version: int
    aggregate_id: str
    correlation_id: str | None = None
    payload: dict[str, Any]

    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)
