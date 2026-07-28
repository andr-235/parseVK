"""task.execution_completed event payload schema."""

from typing import Any

from pydantic import BaseModel, ConfigDict


class TaskExecutionCompletedV1(BaseModel):
    """Payload for task.execution_completed event (v1)."""

    model_config = ConfigDict(extra="ignore")

    taskId: int
    runId: str
    ownerUserId: str
    executor: str
    workerId: str
    executionSequence: int
    processedItems: int
    totalItems: int
    stats: dict[str, Any] | None = None
    completedAt: str | None = None


TaskExecutionCompletedPayload = TaskExecutionCompletedV1
