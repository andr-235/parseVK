"""Tests for explicit TaskRun resume lineage and failure semantics."""

import sys
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.db.models import TaskRun, TaskRunSourceDemand
from app.modules.tasks.state_service import TaskStateService
from app.modules.tasks.task_run import TaskRunFreezeError, freeze_resumed_task_run


def make_task(run_id: str | None, status: str = "failed"):
    now = datetime.now(UTC)
    return SimpleNamespace(
        id=42,
        owner_user_id="user-1",
        title="VK parse",
        description={},
        status=status,
        execution_run_id=run_id,
        last_execution_sequence=0,
        scope="selected",
        mode="recent_posts",
        group_ids=[12345],
        post_limit=10,
        source="manual",
        revision=5,
        source_set_revision=7,
        completed=False,
        total_items=0,
        processed_items=0,
        progress=0.0,
        stats=None,
        error=None,
        skipped_groups_message=None,
        created_at=now,
        updated_at=now,
    )


def previous_run(previous_id, source_id, *, status="failed"):
    return SimpleNamespace(
        id=previous_id,
        task_id=42,
        run_revision=2,
        status=status,
        source_set_revision=9,
        snapshot_sha256="c" * 64,
        config_snapshot={
            "scope": "all",
            "mode": "recent_posts",
            "postLimit": 25,
            "taskRevision": 4,
        },
        source_set_snapshot=[
            {
                "sourceId": str(source_id),
                "provider": "vk",
                "sourceType": "community",
                "externalId": "777",
                "ownerId": -777,
                "sourceRevision": 8,
                "taskRevision": 4,
            }
        ],
        resumed_from_task_run_id=None,
        retry_reason=None,
    )


class ResumeSession:
    def __init__(self, previous=None, existing=None):
        self.previous = previous
        self.existing = existing
        self.added = []

    async def get(self, model, key):
        if self.existing is not None and self.existing.id == key:
            return self.existing
        return None

    async def scalar(self, statement):
        return self.previous

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        return None


@pytest.mark.asyncio
async def test_resumed_run_clones_terminal_parent_with_lineage():
    previous_id = uuid4()
    new_id = uuid4()
    source_id = uuid4()
    previous = previous_run(previous_id, source_id)
    session = ResumeSession(previous=previous)

    meta = await freeze_resumed_task_run(
        session,
        make_task(str(new_id)),
        str(previous_id),
        retry_reason="manual_resume_after_failure",
    )

    run = next(obj for obj in session.added if isinstance(obj, TaskRun))
    demand = next(
        obj for obj in session.added if isinstance(obj, TaskRunSourceDemand)
    )
    assert run.id == new_id
    assert run.run_revision == 3
    assert run.config_snapshot == previous.config_snapshot
    assert run.source_set_snapshot == previous.source_set_snapshot
    assert run.source_set_revision == 9
    assert run.snapshot_sha256 == "c" * 64
    assert run.resumed_from_task_run_id == previous_id
    assert run.retry_reason == "manual_resume_after_failure"
    assert demand.source_id == source_id
    assert meta == {
        "taskRunId": str(new_id),
        "sourceSetRevision": 9,
        "snapshotSha256": "c" * 64,
        "resumedFromTaskRunId": str(previous_id),
        "retryReason": "manual_resume_after_failure",
    }


@pytest.mark.asyncio
@pytest.mark.parametrize("status", ["requested", "running"])
async def test_resume_rejects_non_terminal_parent(status):
    previous_id = uuid4()
    previous = previous_run(previous_id, uuid4(), status=status)

    with pytest.raises(TaskRunFreezeError, match="not terminal"):
        await freeze_resumed_task_run(
            ResumeSession(previous=previous),
            make_task(str(uuid4())),
            str(previous_id),
        )


@pytest.mark.asyncio
async def test_resume_rejects_missing_parent_without_live_fallback():
    with pytest.raises(TaskRunFreezeError, match="does not exist"):
        await freeze_resumed_task_run(
            ResumeSession(previous=None),
            make_task(str(uuid4())),
            str(uuid4()),
        )


@pytest.mark.asyncio
async def test_resume_rejects_absent_previous_run_id():
    with pytest.raises(TaskRunFreezeError, match="without a previous TaskRun"):
        await freeze_resumed_task_run(
            ResumeSession(),
            make_task(str(uuid4())),
            None,
        )


@pytest.mark.asyncio
async def test_existing_child_requires_matching_parent_lineage():
    parent_id = uuid4()
    child_id = uuid4()
    existing = previous_run(child_id, uuid4(), status="requested")
    existing.resumed_from_task_run_id = uuid4()
    existing.retry_reason = "manual_resume"

    with pytest.raises(TaskRunFreezeError, match="conflicting resume lineage"):
        await freeze_resumed_task_run(
            ResumeSession(existing=existing),
            make_task(str(child_id)),
            str(parent_id),
        )


@pytest.mark.asyncio
async def test_state_service_publishes_resumed_lineage_metadata():
    previous_run_id = str(uuid4())
    task = make_task(previous_run_id)
    repository = SimpleNamespace(
        get_task_for_update=AsyncMock(return_value=task),
        add_audit=AsyncMock(),
        touch_task=AsyncMock(return_value=task),
    )
    outbox = SimpleNamespace(add_event=AsyncMock())
    command_publisher = AsyncMock()

    async def freeze_child(session, current_task, previous_id):
        return {
            "taskRunId": current_task.execution_run_id,
            "sourceSetRevision": 6,
            "snapshotSha256": "a" * 64,
            "resumedFromTaskRunId": previous_id,
            "retryReason": "manual_resume",
        }

    service = TaskStateService(
        AsyncMock(),
        repository,
        outbox,
        freezer=AsyncMock(side_effect=freeze_child),
        command_publisher=command_publisher,
    )

    await service.resume_task("user-1", 42)

    resumed = next(
        call
        for call in outbox.add_event.await_args_list
        if call.kwargs["event_type"] == "task.resumed"
    )
    assert resumed.kwargs["payload"]["resumedFromTaskRunId"] == previous_run_id
    assert resumed.kwargs["payload"]["retryReason"] == "manual_resume"
    command_publisher.assert_awaited_once()


@pytest.mark.asyncio
async def test_state_service_does_not_publish_when_parent_snapshot_is_missing():
    task = make_task(None)
    repository = SimpleNamespace(
        get_task_for_update=AsyncMock(return_value=task),
        add_audit=AsyncMock(),
        touch_task=AsyncMock(return_value=task),
    )
    outbox = SimpleNamespace(add_event=AsyncMock())
    command_publisher = AsyncMock()
    freezer = AsyncMock(side_effect=TaskRunFreezeError("missing parent snapshot"))
    service = TaskStateService(
        AsyncMock(),
        repository,
        outbox,
        freezer=freezer,
        command_publisher=command_publisher,
    )

    with pytest.raises(TaskRunFreezeError, match="missing parent snapshot"):
        await service.resume_task("user-1", 42)

    repository.add_audit.assert_not_awaited()
    outbox.add_event.assert_not_awaited()
    command_publisher.assert_not_awaited()
