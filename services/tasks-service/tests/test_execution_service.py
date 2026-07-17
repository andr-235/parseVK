"""Tests for TaskExecutionService — verifies FOR UPDATE is used on all lifecycle methods."""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.bootstrap import ApplicationFactory
from app.modules.tasks.schemas import (
    ExecutionCompleteRequest,
    ExecutionFailRequest,
    ExecutionProgressRequest,
    ExecutionStartRequest,
)


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
def service():
    session = AsyncMock()
    return ApplicationFactory(session).create_tasks_service()


@pytest.fixture
def task_mock():
    task = MagicMock()
    task.id = 42
    task.owner_user_id = "user-1"
    task.scope = "selected"
    task.mode = "recent_posts"
    task.group_ids = [1, 2]
    task.post_limit = 10
    task.source = "manual"
    task.status = "running"
    task.execution_run_id = "run-42"
    task.processed_items = 10
    task.total_items = 100
    task.progress = 0.1
    task.stats = {"processed": 10, "total": 100}
    task.error = None
    task.skipped_groups_message = None
    task.created_at.isoformat.return_value = "2026-01-01T00:00:00+00:00"
    task.updated_at.isoformat.return_value = "2026-01-01T00:00:00+00:00"
    return task


def _configure_repository(service, task_mock):
    service.crud.repository.get_task_by_id_for_update = AsyncMock(return_value=task_mock)
    service.crud.repository.get_task_by_id = AsyncMock()
    service.crud.repository.add_audit = AsyncMock()
    service.crud.repository.touch_task = AsyncMock(return_value=task_mock)
    service.crud.outbox.add_event = AsyncMock()


@pytest.mark.anyio
async def test_start_execution_uses_for_update(service, task_mock):
    _configure_repository(service, task_mock)
    task_mock.status = "pending"

    payload = ExecutionStartRequest(runId="run-42", worker="worker-1")
    await service.execution.start_execution(42, payload)

    service.crud.repository.get_task_by_id_for_update.assert_awaited_once_with(42)
    service.crud.repository.get_task_by_id.assert_not_awaited()


@pytest.mark.anyio
async def test_update_execution_progress_uses_for_update(service, task_mock):
    _configure_repository(service, task_mock)

    payload = ExecutionProgressRequest(
        runId="run-42", processedItems=20, totalItems=100, progress=0.2, stats={"processed": 20}
    )
    await service.execution.update_execution_progress(42, payload)

    service.crud.repository.get_task_by_id_for_update.assert_awaited_once_with(42)
    service.crud.repository.get_task_by_id.assert_not_awaited()


@pytest.mark.anyio
async def test_complete_execution_uses_for_update(service, task_mock):
    _configure_repository(service, task_mock)

    payload = ExecutionCompleteRequest(
        runId="run-42", processedItems=100, totalItems=100, stats={"processed": 100}
    )
    await service.execution.complete_execution(42, payload)

    service.crud.repository.get_task_by_id_for_update.assert_awaited_once_with(42)
    service.crud.repository.get_task_by_id.assert_not_awaited()


@pytest.mark.anyio
async def test_fail_execution_uses_for_update(service, task_mock):
    _configure_repository(service, task_mock)

    payload = ExecutionFailRequest(
        runId="run-42",
        error="VK API timeout",
        processedItems=10,
        totalItems=100,
        stats={"processed": 10},
    )
    await service.execution.fail_execution(42, payload)

    service.crud.repository.get_task_by_id_for_update.assert_awaited_once_with(42)
    service.crud.repository.get_task_by_id.assert_not_awaited()
