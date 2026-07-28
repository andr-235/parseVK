"""task.execution_progressed event payload schema."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class TaskExecutionProgressedV1(BaseModel):
    """Payload for task.execution_progressed event (v1)."""

    model_config = ConfigDict(extra="ignore")

    taskId: int
    runId: str
    ownerUserId: str
    executor: str
    executionSequence: int
    processedItems: int
    totalItems: int
    progress: float
    stats: dict[str, Any] | None = None
    occurredAt: datetime | None = None


TaskExecutionProgressedPayload = TaskExecutionProgressedV1
