from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.background import vk_command_replay


@pytest.mark.anyio
async def test_replay_queues_active_frozen_run_with_cutover_key(monkeypatch):
    task_run_id = uuid4()
    execution_id = uuid4()
    task = SimpleNamespace(id=11)
    task_run = SimpleNamespace(id=task_run_id)
    result = SimpleNamespace(all=lambda: [(task, task_run)])
    session = SimpleNamespace(execute=AsyncMock(return_value=result))
    command = SimpleNamespace(
        execution_id=execution_id,
        to_wire=lambda: {"taskId": 11, "executionId": str(execution_id)},
    )
    build = AsyncMock(return_value=command)
    add_event = AsyncMock()
    outbox = SimpleNamespace(add_event=add_event)

    monkeypatch.setattr(vk_command_replay, "build_vk_execution_requested", build)
    monkeypatch.setattr(
        vk_command_replay,
        "OutboxService",
        lambda actual_session: outbox,
    )

    queued = await vk_command_replay.replay_active_vk_commands(session)

    assert queued == 1
    build.assert_awaited_once_with(session, task, task_run_id)
    add_event.assert_awaited_once()
    kwargs = add_event.await_args.kwargs
    assert kwargs["aggregate_id"] == str(execution_id)
    assert kwargs["correlation_id"] == str(execution_id)
    assert kwargs["dedupe_key"].endswith(str(execution_id))
    assert vk_command_replay.CUTOVER_REPLAY_VERSION in kwargs["dedupe_key"]
