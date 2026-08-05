from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.modules.execution_events.service import ExecutionEventService


def _task_row(run_id: str, *, status: str = "pending") -> tuple:
    return (42, status, run_id, 0, 3)


def _result_with_row(row):
    result = MagicMock()
    result.one_or_none.return_value = row
    return result


@pytest.mark.anyio
async def test_rejected_execution_fails_pending_task_and_run():
    run_id = str(uuid4())
    session = AsyncMock()
    session.add = MagicMock()
    session.execute = AsyncMock(
        side_effect=[
            _result_with_row(_task_row(run_id)),
            MagicMock(),
            MagicMock(),
            MagicMock(),
        ]
    )
    service = ExecutionEventService(session)

    applied = await service.apply_failed(
        task_id=42,
        run_id=run_id,
        execution_sequence=1,
        processed_items=0,
        total_items=0,
        stats={},
        error="another TaskRun for this task is still active",
        failure_kind="rejected",
        owner_user_id="user-1",
    )

    assert applied is True
    assert session.execute.await_count == 4
    task_update = session.execute.await_args_list[1]
    assert task_update.args[1]["error"] == (
        "another TaskRun for this task is still active"
    )
    event_types = [
        call.args[0].event_type for call in session.add.call_args_list
    ]
    assert event_types == ["task.failed", "task.state_changed"]


@pytest.mark.anyio
async def test_runtime_failure_does_not_fail_pending_task():
    run_id = str(uuid4())
    session = AsyncMock()
    session.add = MagicMock()
    session.execute = AsyncMock(
        return_value=_result_with_row(_task_row(run_id))
    )
    service = ExecutionEventService(session)

    applied = await service.apply_failed(
        task_id=42,
        run_id=run_id,
        execution_sequence=1,
        processed_items=0,
        total_items=0,
        stats={},
        error="worker crashed before start",
        failure_kind="runtime",
        owner_user_id="user-1",
    )

    assert applied is True
    session.execute.assert_awaited_once()
    session.add.assert_not_called()
