from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest

from app.background import vk_command_replay


@pytest.mark.anyio
async def test_replay_queues_active_frozen_run_with_stable_cutover_key(monkeypatch):
    task_run_id = uuid4()
    execution_id = uuid4()
    task = SimpleNamespace(id=11, execution_run_id=str(task_run_id))
    task_run = SimpleNamespace(
        id=task_run_id,
        task_id=11,
        status="requested",
        snapshot_sha256="a" * 64,
        source_set_snapshot=[{"sourceId": str(uuid4())}],
    )
    session = SimpleNamespace(
        scalars=AsyncMock(return_value=[task]),
        get=AsyncMock(return_value=task_run),
    )
    command = SimpleNamespace(
        execution_id=execution_id,
        to_wire=lambda: {"taskId": 11, "executionId": str(execution_id)},
    )
    build = AsyncMock(return_value=command)
    add_event = AsyncMock()
    outbox = SimpleNamespace(add_event=add_event, session=session)

    monkeypatch.setattr(vk_command_replay, "build_vk_execution_requested", build)
    monkeypatch.setattr(
        vk_command_replay,
        "OutboxService",
        lambda actual_session: outbox,
    )

    replayed = await vk_command_replay.replay_active_vk_commands(session)

    assert replayed == 1
    build.assert_awaited_once_with(session, task, task_run_id)
    kwargs = add_event.await_args.kwargs
    assert kwargs["aggregate_id"] == str(execution_id)
    assert kwargs["correlation_id"] == str(execution_id)
    assert kwargs["dedupe_key"] == (
        f"vk.execution.requested:{vk_command_replay.CUTOVER_REPLAY_KEY}:"
        f"{execution_id}"
    )

    statement = session.scalars.await_args.args[0]
    assert statement._for_update_arg.skip_locked is True


@pytest.mark.anyio
async def test_unreplayable_active_task_is_failed_and_audited(monkeypatch):
    task = SimpleNamespace(
        id=12,
        owner_user_id="user-12",
        execution_run_id=None,
        status="running",
        error=None,
        revision=3,
        updated_at=None,
    )
    session = SimpleNamespace(
        scalars=AsyncMock(return_value=[task]),
        get=AsyncMock(),
        add=Mock(),
    )
    add_event = AsyncMock()
    outbox = SimpleNamespace(add_event=add_event, session=session)

    monkeypatch.setattr(
        vk_command_replay,
        "OutboxService",
        lambda actual_session: outbox,
    )
    monkeypatch.setattr(
        vk_command_replay,
        "task_state_changed_payload",
        lambda actual_task: {
            "taskId": str(actual_task.id),
            "status": actual_task.status,
        },
    )

    replayed = await vk_command_replay.replay_active_vk_commands(session)

    assert replayed == 0
    assert task.status == "failed"
    assert task.revision == 4
    assert vk_command_replay.REPLAY_FAILURE in task.error
    session.add.assert_called_once()
    assert add_event.await_args.kwargs["event_type"] == "task.state_changed"


@pytest.mark.anyio
async def test_invalid_frozen_run_is_failed_without_building_command(monkeypatch):
    task_run_id = uuid4()
    task = SimpleNamespace(
        id=13,
        owner_user_id="user-13",
        execution_run_id=str(task_run_id),
        status="pending",
        error=None,
        revision=1,
        updated_at=None,
    )
    task_run = SimpleNamespace(
        id=task_run_id,
        task_id=13,
        status="requested",
        snapshot_sha256=None,
        source_set_snapshot=None,
    )
    session = SimpleNamespace(
        scalars=AsyncMock(return_value=[task]),
        get=AsyncMock(return_value=task_run),
        add=Mock(),
    )
    build = AsyncMock()
    outbox = SimpleNamespace(add_event=AsyncMock(), session=session)

    monkeypatch.setattr(vk_command_replay, "build_vk_execution_requested", build)
    monkeypatch.setattr(
        vk_command_replay,
        "OutboxService",
        lambda actual_session: outbox,
    )
    monkeypatch.setattr(
        vk_command_replay,
        "task_state_changed_payload",
        lambda actual_task: {"taskId": str(actual_task.id)},
    )

    assert await vk_command_replay.replay_active_vk_commands(session) == 0
    build.assert_not_awaited()
    assert task.status == "failed"
    assert task_run.status == "failed"
