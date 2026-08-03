"""Tests for TaskRun freeze lifecycle and retry semantics."""

import sys
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import UUID, uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.db.models import TaskRun, TaskRunSourceDemand
from app.modules.tasks.state_service import TaskStateService
from app.modules.tasks.task_run import (
    TaskRunFreezeError,
    freeze_resumed_task_run,
    freeze_task_run,
)


def make_task(
    run_id: str | None = None,
    revision: int = 5,
    status: str = "pending",
):
    return SimpleNamespace(
        id=42,
        owner_user_id="user-1",
        title="VK parse",
        description={},
        status=status,
        execution_run_id=run_id or str(uuid4()),
        last_execution_sequence=0,
        scope="selected",
        mode="recent_posts",
        group_ids=[12345],
        post_limit=10,
        source="manual",
        revision=revision,
        completed=False,
        total_items=0,
        processed_items=0,
        progress=0.0,
        stats=None,
        error=None,
        skipped_groups_message=None,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


def make_source(
    source_id: UUID,
    external_id: str,
    revision: int = 2,
):
    return SimpleNamespace(
        id=source_id,
        provider="vk",
        source_type="community",
        external_id=external_id,
        owner_id=-int(external_id),
        revision=revision,
    )


def make_link(source_id: UUID):
    return SimpleNamespace(source_id=source_id, kind="target")


class FakeFreezeSession:
    def __init__(self, existing=None):
        self.added = []
        self.existing = existing

    async def get(self, model, key):
        return self.existing

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        return None


class MappingFreezeSession:
    def __init__(self, existing_by_id=None):
        self.added = []
        self.existing_by_id = existing_by_id or {}

    async def get(self, model, key):
        return self.existing_by_id.get(key)

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        return None


def source_repo(*sources):
    by_id = {source.id: source for source in sources}
    return SimpleNamespace(
        list_task_sources=AsyncMock(
            return_value=[make_link(source.id) for source in sources]
        ),
        list_sources_by_ids=AsyncMock(
            side_effect=lambda ids: sorted(
                (by_id[source_id] for source_id in ids),
                key=lambda source: (
                    source.provider,
                    source.source_type,
                    source.external_id,
                    str(source.id),
                ),
            )
        ),
    )


@pytest.mark.asyncio
async def test_freeze_creates_snapshot_with_contract_fields():
    source_id = uuid4()
    source = make_source(source_id, "12345")
    task = make_task()
    session = FakeFreezeSession()

    meta = await freeze_task_run(
        session,
        task,
        sources_repo=source_repo(source),
    )

    run = next(obj for obj in session.added if isinstance(obj, TaskRun))
    assert str(run.id) == task.execution_run_id
    assert run.config_snapshot == {
        "scope": "selected",
        "mode": "recent_posts",
        "postLimit": 10,
        "taskRevision": 5,
    }
    assert "groupIds" not in run.config_snapshot
    assert run.source_set_snapshot[0] == {
        "sourceId": str(source_id),
        "provider": "vk",
        "sourceType": "community",
        "externalId": "12345",
        "ownerId": -12345,
        "sourceRevision": 2,
        "taskRevision": 5,
    }
    assert len(run.snapshot_sha256) == 64
    demand = next(
        obj
        for obj in session.added
        if isinstance(obj, TaskRunSourceDemand)
    )
    assert demand.source_id == source_id
    assert meta["snapshotSha256"] == run.snapshot_sha256


@pytest.mark.asyncio
async def test_freeze_reuses_existing_snapshot_without_reading_live_sources():
    run_id = uuid4()
    existing = SimpleNamespace(
        id=run_id,
        task_id=42,
        source_set_revision=3,
        snapshot_sha256="a" * 64,
        source_set_snapshot=[{"sourceId": str(uuid4())}],
    )
    repo = SimpleNamespace(
        list_task_sources=AsyncMock(),
        list_sources_by_ids=AsyncMock(),
    )

    meta = await freeze_task_run(
        FakeFreezeSession(existing=existing),
        make_task(run_id=str(run_id), revision=99),
        sources_repo=repo,
    )

    assert meta == {
        "taskRunId": str(run_id),
        "sourceSetRevision": 3,
        "snapshotSha256": "a" * 64,
    }
    repo.list_task_sources.assert_not_awaited()
    repo.list_sources_by_ids.assert_not_awaited()


@pytest.mark.asyncio
async def test_resumed_run_clones_previous_physical_plan():
    previous_id = uuid4()
    new_id = uuid4()
    source_id = uuid4()
    previous = SimpleNamespace(
        id=previous_id,
        task_id=42,
        run_revision=2,
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
    )
    session = MappingFreezeSession({previous_id: previous})
    task = make_task(run_id=str(new_id), revision=100)
    task.scope = "selected"
    task.post_limit = 1

    meta = await freeze_resumed_task_run(
        session,
        task,
        str(previous_id),
    )

    run = next(obj for obj in session.added if isinstance(obj, TaskRun))
    demand = next(
        obj
        for obj in session.added
        if isinstance(obj, TaskRunSourceDemand)
    )
    assert run.id == new_id
    assert run.run_revision == 3
    assert run.config_snapshot == previous.config_snapshot
    assert run.source_set_snapshot == previous.source_set_snapshot
    assert run.source_set_revision == 9
    assert run.snapshot_sha256 == "c" * 64
    assert demand.source_id == source_id
    assert meta == {
        "taskRunId": str(new_id),
        "sourceSetRevision": 9,
        "snapshotSha256": "c" * 64,
    }


@pytest.mark.asyncio
async def test_freeze_rejects_incomplete_existing_snapshot():
    run_id = uuid4()
    existing = SimpleNamespace(
        id=run_id,
        task_id=42,
        source_set_revision=1,
        snapshot_sha256="a" * 64,
        source_set_snapshot=[],
    )
    with pytest.raises(TaskRunFreezeError):
        await freeze_task_run(
            FakeFreezeSession(existing=existing),
            make_task(run_id=str(run_id)),
        )


@pytest.mark.asyncio
async def test_freeze_rejects_run_owned_by_another_task():
    run_id = uuid4()
    existing = SimpleNamespace(
        id=run_id,
        task_id=999,
        source_set_revision=1,
        snapshot_sha256="a" * 64,
        source_set_snapshot=[{"sourceId": str(uuid4())}],
    )
    with pytest.raises(TaskRunFreezeError):
        await freeze_task_run(
            FakeFreezeSession(existing=existing),
            make_task(run_id=str(run_id)),
        )


@pytest.mark.asyncio
async def test_snapshot_hash_is_independent_of_repository_order():
    first = make_source(uuid4(), "10")
    second = make_source(uuid4(), "20")
    task_a = make_task(run_id=str(uuid4()))
    task_b = make_task(run_id=str(uuid4()))

    meta_a = await freeze_task_run(
        FakeFreezeSession(),
        task_a,
        sources_repo=source_repo(second, first),
    )
    meta_b = await freeze_task_run(
        FakeFreezeSession(),
        task_b,
        sources_repo=source_repo(first, second),
    )

    assert meta_a["snapshotSha256"] == meta_b["snapshotSha256"]


@pytest.mark.asyncio
async def test_freeze_rejects_empty_source_set():
    with pytest.raises(TaskRunFreezeError):
        await freeze_task_run(
            FakeFreezeSession(),
            make_task(),
            sources_repo=source_repo(),
        )


@pytest.mark.asyncio
async def test_freeze_invalid_run_id_raises():
    task = make_task()
    task.execution_run_id = "not-a-uuid"
    with pytest.raises(TaskRunFreezeError):
        await freeze_task_run(FakeFreezeSession(), task)


@pytest.mark.asyncio
async def test_resume_creates_new_run_and_publishes_child_command():
    previous_run_id = str(uuid4())
    task = make_task(run_id=previous_run_id, status="failed")
    repository = SimpleNamespace(
        get_task_for_update=AsyncMock(return_value=task),
        add_audit=AsyncMock(),
        touch_task=AsyncMock(return_value=task),
    )
    outbox = SimpleNamespace(add_event=AsyncMock())
    freezer = AsyncMock()
    command_publisher = AsyncMock()

    async def freeze_child(session, current_task, previous_id):
        assert previous_id == previous_run_id
        return {
            "taskRunId": current_task.execution_run_id,
            "sourceSetRevision": 6,
            "snapshotSha256": "a" * 64,
        }

    freezer.side_effect = freeze_child
    service = TaskStateService(
        AsyncMock(),
        repository,
        outbox,
        freezer=freezer,
        command_publisher=command_publisher,
    )

    await service.resume_task("user-1", 42)

    assert task.execution_run_id != previous_run_id
    freezer.assert_awaited_once_with(
        service.session,
        task,
        previous_run_id,
    )
    command_publisher.assert_awaited_once_with(
        service.session,
        outbox,
        task,
        {
            "taskRunId": task.execution_run_id,
            "sourceSetRevision": 6,
            "snapshotSha256": "a" * 64,
        },
    )
    resumed = next(
        call
        for call in outbox.add_event.await_args_list
        if call.kwargs["event_type"] == "task.resumed"
    )
    assert resumed.kwargs["payload"]["runId"] == task.execution_run_id
    assert resumed.kwargs["payload"]["snapshotSha256"] == "a" * 64
    audit = repository.add_audit.await_args.args[0]
    assert audit.event_data["previousRunId"] == previous_run_id


@pytest.mark.asyncio
async def test_resume_creates_run_when_legacy_run_id_is_missing():
    task = make_task(status="failed")
    task.execution_run_id = None
    repository = SimpleNamespace(
        get_task_for_update=AsyncMock(return_value=task),
        add_audit=AsyncMock(),
        touch_task=AsyncMock(return_value=task),
    )
    outbox = SimpleNamespace(add_event=AsyncMock())
    freezer = AsyncMock(
        side_effect=lambda session, current_task, previous_id: {
            "taskRunId": current_task.execution_run_id,
            "sourceSetRevision": 1,
            "snapshotSha256": "b" * 64,
        }
    )
    command_publisher = AsyncMock()
    service = TaskStateService(
        AsyncMock(),
        repository,
        outbox,
        freezer=freezer,
        command_publisher=command_publisher,
    )

    await service.resume_task("user-1", 42)

    assert task.execution_run_id is not None
    command_publisher.assert_awaited_once()
