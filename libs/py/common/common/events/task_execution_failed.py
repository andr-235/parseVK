"""task.execution_failed event payload schema."""

from typing import Any

from pydantic import BaseModel, ConfigDict


class TaskExecutionFailedV1(BaseModel):
    """Payload for task.execution_failed event (v1)."""

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
    error: str
    failureKind: str
    failedAt: str | None = None


TaskExecutionFailedPayload = TaskExecutionFailedV1
