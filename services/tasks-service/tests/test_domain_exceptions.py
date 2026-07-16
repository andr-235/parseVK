"""Unit tests for tasks-service domain exceptions."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.tasks.exceptions import TaskConflictError, TaskError, TaskNotFoundError


def test_task_not_found_error_has_task_id():
    error = TaskNotFoundError(task_id=42)
    assert error.task_id == 42
    assert "Task not found: 42" in str(error)


def test_task_not_found_error_defaults():
    error = TaskNotFoundError()
    assert error.task_id is None


def test_task_conflict_error_has_context():
    error = TaskConflictError("Task already running", task_id=42, current_status="running")
    assert error.task_id == 42
    assert error.current_status == "running"
    assert str(error) == "Task already running"


def test_task_conflict_error_defaults():
    error = TaskConflictError("Something went wrong")
    assert error.task_id is None
    assert error.current_status is None


def test_exception_hierarchy():
    assert issubclass(TaskNotFoundError, TaskError)
    assert issubclass(TaskConflictError, TaskError)
    assert isinstance(TaskNotFoundError(), TaskError)
    assert isinstance(TaskConflictError("test"), TaskError)


def test_exception_message_preserved():
    msg = "Custom task error message"
    error = TaskConflictError(msg)
    assert str(error) == msg
