"""task.execution_started event payload schema."""

from typing import Any

from pydantic import BaseModel, ConfigDict


class TaskExecutionStartedV1(BaseModel):
    """Payload for task.execution_started event (v1)."""

    model_config = ConfigDict(extra="ignore")

    taskId: int
    runId: str
    ownerUserId: str
    executor: str
    workerId: str
    attempt: int
    executionSequence: int
    startedAt: str | None = None


TaskExecutionStartedPayload = TaskExecutionStartedV1
