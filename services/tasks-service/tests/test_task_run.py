"""Tests for TaskRun freeze lifecycle and AC regressions."""

import sys
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
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
    def __init__(self):
        self.added = []

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        return None


@pytest.fixture(autouse=True)
def enable_compat_flag(monkeypatch):
    monkeypatch.setattr(settings, "source_compat_write_enabled", True)


@pytest.mark.asyncio
async def test_freeze_creates_immutable_snapshot_with_contract_fields():
    source_id = uuid4()
    task = make_task()
    session = FakeFreezeSession()
    repo = SimpleNamespace(
        list_task_sources=AsyncMock(return_value=[make_link(source_id)]),
        get_source_by_id=AsyncMock(return_value=make_source(source_id, "12345")),
    )

    meta = await freeze_task_run(session, task, sources_repo=repo)

    runs = [o for o in session.added if isinstance(o, TaskRun)]
    assert len(runs) == 1
    run = runs[0]
    assert str(run.id) == task.execution_run_id
    assert run.config_snapshot == {
        "scope": "selected",
        "mode": "recent_posts",
        "postLimit": 10,
        "groupIds": [12345],
    }
    source_set = run.source_set_snapshot
    assert source_set[0]["sourceId"] == str(source_id)
    assert source_set[0]["provider"] == "vk"
    assert source_set[0]["sourceType"] == "community"
    assert source_set[0]["externalId"] == "12345"
    assert source_set[0]["ownerId"] == -12345
    assert source_set[0]["sourceRevision"] == 2
    assert source_set[0]["taskRevision"] == 5
    assert run.source_set_revision == 5
    assert run.snapshot_sha256 and len(run.snapshot_sha256) == 64
    demands = [o for o in session.added if isinstance(o, TaskRunSourceDemand)]
    assert len(demands) == 1
    assert demands[0].source_id == source_id
    assert meta["sourceSetRevision"] == 5
    assert meta["snapshotSha256"] == run.snapshot_sha256


@pytest.mark.asyncio
async def test_freeze_sha256_deterministic():
    source_id = uuid4()
    repo = SimpleNamespace(
        list_task_sources=AsyncMock(return_value=[make_link(source_id)]),
        get_source_by_id=AsyncMock(return_value=make_source(source_id, "12345")),
    )

    meta1 = await freeze_task_run(FakeFreezeSession(), make_task(), sources_repo=repo)
    meta2 = await freeze_task_run(FakeFreezeSession(), make_task(), sources_repo=repo)

    assert meta1["snapshotSha256"] == meta2["snapshotSha256"]


@pytest.mark.asyncio
async def test_freeze_sha256_changes_when_config_changes():
    source_id = uuid4()
    repo = SimpleNamespace(
        list_task_sources=AsyncMock(return_value=[make_link(source_id)]),
        get_source_by_id=AsyncMock(return_value=make_source(source_id, "12345")),
    )

    meta_a = await freeze_task_run(FakeFreezeSession(), make_task(revision=5), sources_repo=repo)
    meta_b = await freeze_task_run(FakeFreezeSession(), make_task(revision=6), sources_repo=repo)

    assert meta_a["snapshotSha256"] != meta_b["snapshotSha256"]


@pytest.mark.asyncio
async def test_freeze_no_execution_run_id_returns_none():
    task = make_task()
    task.execution_run_id = None
    assert await freeze_task_run(FakeFreezeSession(), task) is None


@pytest.mark.asyncio
async def test_freeze_invalid_run_id_raises():
    task = make_task()
    task.execution_run_id = "not-a-uuid"
    with pytest.raises(TaskRunFreezeError):
        await freeze_task_run(FakeFreezeSession(), task)


@pytest.mark.asyncio
async def test_source_added_after_start_does_not_enter_active_run():
    """AC (b): a source added after run start must not enter the active run."""
    first_id, second_id = uuid4(), uuid4()
    first_run = make_task(run_id=str(uuid4()))
    second_run = make_task(run_id=str(uuid4()))

    session = FakeFreezeSession()
    first_repo = SimpleNamespace(
        list_task_sources=AsyncMock(return_value=[make_link(first_id)]),
        get_source_by_id=AsyncMock(return_value=make_source(first_id, "12345")),
    )
    second_repo = SimpleNamespace(
        list_task_sources=AsyncMock(
            return_value=[make_link(first_id), make_link(second_id)]
        ),
        get_source_by_id=AsyncMock(
            side_effect=lambda source_id: make_source(
                source_id, "12345" if source_id == first_id else "67890"
            )
        ),
    )

    await freeze_task_run(session, first_run, sources_repo=first_repo)
    await freeze_task_run(session, second_run, sources_repo=second_repo)

    demands = [o for o in session.added if isinstance(o, TaskRunSourceDemand)]
    active_run_demands = {
        str(d.source_id)
        for d in demands
        if str(d.task_run_id) == first_run.execution_run_id
    }
    assert active_run_demands == {str(first_id)}
    new_run_demands = {
        str(d.source_id)
        for d in demands
        if str(d.task_run_id) == second_run.execution_run_id
    }
    assert new_run_demands == {str(first_id), str(second_id)}


@pytest.mark.asyncio
async def test_resume_freezes_new_run_with_new_sha():
    task = make_task(run_id="old-run", status="failed")
    repository = SimpleNamespace(
        get_task_for_update=AsyncMock(return_value=task),
        add_audit=AsyncMock(),
        touch_task=AsyncMock(return_value=task),
    )
    outbox = SimpleNamespace(add_event=AsyncMock())
    freezer = AsyncMock(return_value={"sourceSetRevision": 6, "snapshotSha256": "a" * 64})
    service = TaskStateService(AsyncMock(), repository, outbox, freezer=freezer)

    await service.resume_task("user-1", 42)

    freezer.assert_awaited_once()
    resumed_call = next(
        call for call in outbox.add_event.await_args_list if call.kwargs["event_type"] == "task.resumed"
    )
    assert resumed_call.kwargs["payload"]["snapshotSha256"] == "a" * 64
    assert resumed_call.kwargs["payload"]["sourceSetRevision"] == 6


@pytest.mark.asyncio
async def test_resume_with_flag_off_skips_freeze(monkeypatch):
    monkeypatch.setattr(settings, "source_compat_write_enabled", False)
    task = make_task(run_id="old-run", status="failed")
    repository = SimpleNamespace(
        get_task_for_update=AsyncMock(return_value=task),
        add_audit=AsyncMock(),
        touch_task=AsyncMock(return_value=task),
    )
    outbox = SimpleNamespace(add_event=AsyncMock())
    freezer = AsyncMock()
    service = TaskStateService(AsyncMock(), repository, outbox, freezer=freezer)

    await service.resume_task("user-1", 42)

    freezer.assert_not_awaited()


@pytest.mark.asyncio
async def test_resume_freeze_failure_raises_without_outbox_publish():
    task = make_task(run_id="old-run", status="failed")
    repository = SimpleNamespace(
        get_task_for_update=AsyncMock(return_value=task),
        add_audit=AsyncMock(),
        touch_task=AsyncMock(return_value=task),
    )
    outbox = SimpleNamespace(add_event=AsyncMock())
    service = TaskStateService(
        AsyncMock(),
        repository,
        outbox,
        freezer=AsyncMock(side_effect=TaskRunFreezeError("boom")),
    )

    with pytest.raises(TaskRunFreezeError):
        await service.resume_task("user-1", 42)

    outbox.add_event.assert_not_awaited()


@pytest.mark.asyncio
async def test_automation_clones_task_sources_from_base():
    from app.modules.automation.service import AutomationService

    base_id, new_id = 1, 2
    source_id = uuid4()
    session = FakeFreezeSession()
    sources_repo = SimpleNamespace(
        list_task_sources=AsyncMock(return_value=[make_link(source_id)]),
        get_source_by_id=AsyncMock(return_value=make_source(source_id, "12345")),
        link_task_source=AsyncMock(return_value=None),
    )
    service = AutomationService(
        session=session,
        repository=SimpleNamespace(),
        tasks=SimpleNamespace(),
        outbox=SimpleNamespace(),
    )
    base_task = SimpleNamespace(id=base_id)
    new_task = SimpleNamespace(id=new_id)

    with patch("app.modules.sources.repository.SourcesRepository", return_value=sources_repo):
        await service._clone_task_sources(base_task, new_task)

    sources_repo.link_task_source.assert_awaited_once_with(new_id, source_id, "target")
