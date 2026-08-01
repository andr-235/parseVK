"""Tests for TaskRun freeze lifecycle and retry semantics."""

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

from app.core.config import settings
from app.db.models import TaskRun, TaskRunSourceDemand
from app.modules.tasks.state_service import TaskStateService
from app.modules.tasks.task_run import TaskRunFreezeError, freeze_task_run


def make_task(run_id: str | None = None, revision: int = 5, status: str = "pending"):
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


def make_source(source_id, external_id: str, revision: int = 2):
    return SimpleNamespace(
        id=source_id,
        provider="vk",
        source_type="community",
        external_id=external_id,
        owner_id=-int(external_id),
        revision=revision,
    )


def make_link(source_id):
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


@pytest.fixture(autouse=True)
def enable_compat_flag(monkeypatch):
    monkeypatch.setattr(settings, "source_compat_write_enabled", True)


@pytest.mark.asyncio
async def test_freeze_creates_snapshot_with_contract_fields():
    source_id = uuid4()
    source = make_source(source_id, "12345")
    task = make_task()
    session = FakeFreezeSession()

    meta = await freeze_task_run(session, task, sources_repo=source_repo(source))

    run = next(obj for obj in session.added if isinstance(obj, TaskRun))
    assert str(run.id) == task.execution_run_id
    assert run.config_snapshot["groupIds"] == [12345]
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
    demand = next(obj for obj in session.added if isinstance(obj, TaskRunSourceDemand))
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
async def test_freeze_rejects_run_owned_by_another_task():
    run_id = uuid4()
    existing = SimpleNamespace(
        id=run_id,
        task_id=999,
        source_set_revision=1,
        snapshot_sha256="a" * 64,
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
        FakeFreezeSession(), task_a, sources_repo=source_repo(second, first)
    )
    meta_b = await freeze_task_run(
        FakeFreezeSession(), task_b, sources_repo=source_repo(first, second)
    )

    assert meta_a["snapshotSha256"] == meta_b["snapshotSha256"]


@pytest.mark.asyncio
async def test_freeze_invalid_run_id_raises():
    task = make_task()
    task.execution_run_id = "not-a-uuid"
    with pytest.raises(TaskRunFreezeError):
        await freeze_task_run(FakeFreezeSession(), task)


@pytest.mark.asyncio
async def test_resume_keeps_same_run_id_and_reuses_snapshot():
    run_id = str(uuid4())
    task = make_task(run_id=run_id, status="failed")
    repository = SimpleNamespace(
        get_task_for_update=AsyncMock(return_value=task),
        add_audit=AsyncMock(),
        touch_task=AsyncMock(return_value=task),
    )
    outbox = SimpleNamespace(add_event=AsyncMock())
    freezer = AsyncMock(
        return_value={
            "taskRunId": run_id,
            "sourceSetRevision": 6,
            "snapshotSha256": "a" * 64,
        }
    )
    service = TaskStateService(AsyncMock(), repository, outbox, freezer=freezer)

    await service.resume_task("user-1", 42)

    assert task.execution_run_id == run_id
    freezer.assert_awaited_once_with(service.session, task)
    resumed = next(
        call
        for call in outbox.add_event.await_args_list
        if call.kwargs["event_type"] == "task.resumed"
    )
    assert resumed.kwargs["payload"]["snapshotSha256"] == "a" * 64


@pytest.mark.asyncio
async def test_resume_without_run_is_rejected():
    task = make_task(status="failed")
    task.execution_run_id = None
    repository = SimpleNamespace(get_task_for_update=AsyncMock(return_value=task))
    service = TaskStateService(AsyncMock(), repository, SimpleNamespace())

    from app.modules.tasks.exceptions import TaskConflictError

    with pytest.raises(TaskConflictError):
        await service.resume_task("user-1", 42)
