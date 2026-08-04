"""Tests for canonical VK execution command production."""

import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import UUID, uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.core.config import settings
from app.modules.tasks.vk_command import (
    add_vk_execution_command,
    build_vk_execution_requested,
    execution_id_for_run,
)


class FakeSession:
    def __init__(self, run, demands):
        self.run = run
        self.demands = demands

    async def get(self, model, key):
        return self.run

    async def scalars(self, statement):
        return self.demands


def make_task(task_id: int = 42):
    return SimpleNamespace(
        id=task_id,
        owner_user_id="user-42",
        revision=7,
    )


def make_run(run_id: UUID):
    return SimpleNamespace(
        id=run_id,
        task_id=42,
        snapshot_sha256="a" * 64,
        source_set_revision=5,
        config_snapshot={
            "scope": "selected",
            "mode": "recent_posts",
            "postLimit": 25,
            "taskRevision": 7,
        },
    )


def make_demand(external_id: str):
    source_id = uuid4()
    return SimpleNamespace(
        id=uuid4(),
        source_id=source_id,
        created_at=None,
        payload={
            "sourceId": str(source_id),
            "provider": "vk",
            "sourceType": "community",
            "externalId": external_id,
            "ownerId": -int(external_id),
            "sourceRevision": 2,
            "taskRevision": 7,
        },
    )


@pytest.mark.asyncio
async def test_build_vk_command_uses_frozen_demands_and_stable_execution_id():
    run_id = uuid4()
    command = await build_vk_execution_requested(
        FakeSession(make_run(run_id), [make_demand("10"), make_demand("20")]),
        make_task(),
        run_id,
    )

    assert command.execution_id == execution_id_for_run(run_id)
    assert command.task_run_id == run_id
    assert command.owner_user_id == "user-42"
    assert [item.source.external_id for item in command.demands] == ["10", "20"]
    assert command.post_selection.limit_per_source == 25
    assert command.snapshot_sha256 == "a" * 64


@pytest.mark.asyncio
async def test_add_vk_command_persists_camel_case_payload(monkeypatch):
    monkeypatch.setattr(settings, "vk_commands_publish_enabled", True)
    run_id = uuid4()
    outbox = SimpleNamespace(add_event=AsyncMock())

    command = await add_vk_execution_command(
        FakeSession(make_run(run_id), [make_demand("10")]),
        outbox,
        make_task(),
        {
            "taskRunId": str(run_id),
            "sourceSetRevision": 5,
            "snapshotSha256": "a" * 64,
        },
    )

    assert command is not None
    call = outbox.add_event.await_args.kwargs
    assert call["event_type"] == "vk.execution.requested"
    assert call["event_version"] == 2
    assert call["aggregate_id"] == str(command.execution_id)
    assert call["correlation_id"] == str(command.execution_id)
    assert call["payload"]["taskRunId"] == str(run_id)
    assert call["payload"]["ownerUserId"] == "user-42"
    assert call["payload"]["demands"][0]["source"]["externalId"] == "10"


@pytest.mark.asyncio
async def test_execution_id_changes_only_with_task_run():
    first = uuid4()
    second = uuid4()

    assert execution_id_for_run(first) == execution_id_for_run(first)
    assert execution_id_for_run(first) != execution_id_for_run(second)
