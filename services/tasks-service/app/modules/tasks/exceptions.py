"""Domain exceptions for tasks-service.

Replaces HTTPException in the service layer with structured domain errors
that carry business context (task_id, status) for proper error handling
at the router layer.
"""

import logging

logger = logging.getLogger(__name__)


class TaskError(Exception):
    """Base exception for tasks-service domain errors."""


class TaskNotFoundError(TaskError):
    """Task not found."""

    def __init__(self, task_id: int | None = None):
        self.task_id = task_id
        super().__init__(f"Task not found: {task_id}")


class TaskConflictError(TaskError):
    """Invalid task state transition or conflict."""

    def __init__(self, message: str, task_id: int | None = None, current_status: str | None = None):
        self.task_id = task_id
        self.current_status = current_status
        super().__init__(message)
