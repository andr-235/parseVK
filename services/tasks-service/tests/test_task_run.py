"""Tests for immutable root TaskRun snapshots."""

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
from app.modules.tasks.task_run import TaskRunFreezeError, freeze_task_run


def make_task(
    run_id: str | None = None,
    revision: int = 5,
    source_set_revision: int = 7,
):
    return SimpleNamespace(
        id=42,
        owner_user_id="user-1",
        execution_run_id=run_id or str(uuid4()),
        scope="selected",
        mode="recent_posts",
        group_ids=[12345],
        post_limit=10,
        source="manual",
        revision=revision,
        source_set_revision=source_set_revision,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


def make_source(source_id: UUID, external_id: str, revision: int = 2):
    return SimpleNamespace(
        id=source_id,
        provider="vk",
        source_type="community",
        external_id=external_id,
        owner_id=-int(external_id),
        revision=revision,
    )


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
            return_value=[
                SimpleNamespace(source_id=source.id, kind="target")
                for source in sources
            ]
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
async def test_freeze_creates_complete_root_snapshot():
    source_id = uuid4()
    task = make_task()
    session = FakeFreezeSession()

    meta = await freeze_task_run(
        session,
        task,
        sources_repo=source_repo(make_source(source_id, "12345")),
    )

    run = next(obj for obj in session.added if isinstance(obj, TaskRun))
    demand = next(
        obj for obj in session.added if isinstance(obj, TaskRunSourceDemand)
    )
    assert str(run.id) == task.execution_run_id
    assert run.config_snapshot == {
        "scope": "selected",
        "mode": "recent_posts",
        "postLimit": 10,
        "taskRevision": 5,
    }
    assert run.source_set_revision == 7
    assert run.source_set_snapshot == [
        {
            "sourceId": str(source_id),
            "provider": "vk",
            "sourceType": "community",
            "externalId": "12345",
            "ownerId": -12345,
            "kind": "target",
            "sourceRevision": 2,
            "taskRevision": 5,
        }
    ]
    assert run.resumed_from_task_run_id is None
    assert run.retry_reason is None
    assert len(run.snapshot_sha256) == 64
    assert demand.source_id == source_id
    assert meta == {
        "taskRunId": task.execution_run_id,
        "sourceSetRevision": 7,
        "snapshotSha256": run.snapshot_sha256,
    }


@pytest.mark.asyncio
async def test_freeze_reuses_existing_snapshot_without_live_reads():
    run_id = uuid4()
    existing = SimpleNamespace(
        id=run_id,
        task_id=42,
        source_set_revision=3,
        snapshot_sha256="a" * 64,
        config_snapshot={"postLimit": 1},
        source_set_snapshot=[{"sourceId": str(uuid4())}],
        resumed_from_task_run_id=None,
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
async def test_freeze_rejects_incomplete_existing_snapshot():
    existing = SimpleNamespace(
        id=uuid4(),
        task_id=42,
        source_set_revision=1,
        snapshot_sha256="a" * 64,
        config_snapshot={"postLimit": 1},
        source_set_snapshot=[],
        resumed_from_task_run_id=None,
    )
    with pytest.raises(TaskRunFreezeError):
        await freeze_task_run(
            FakeFreezeSession(existing=existing),
            make_task(run_id=str(existing.id)),
        )


@pytest.mark.asyncio
async def test_freeze_rejects_run_owned_by_another_task():
    existing = SimpleNamespace(
        id=uuid4(),
        task_id=999,
        source_set_revision=1,
        snapshot_sha256="a" * 64,
        config_snapshot={"postLimit": 1},
        source_set_snapshot=[{"sourceId": str(uuid4())}],
        resumed_from_task_run_id=None,
    )
    with pytest.raises(TaskRunFreezeError):
        await freeze_task_run(
            FakeFreezeSession(existing=existing),
            make_task(run_id=str(existing.id)),
        )


@pytest.mark.asyncio
async def test_snapshot_hash_is_independent_of_repository_order():
    first = make_source(uuid4(), "10")
    second = make_source(uuid4(), "20")

    meta_a = await freeze_task_run(
        FakeFreezeSession(),
        make_task(run_id=str(uuid4())),
        sources_repo=source_repo(second, first),
    )
    meta_b = await freeze_task_run(
        FakeFreezeSession(),
        make_task(run_id=str(uuid4())),
        sources_repo=source_repo(first, second),
    )

    assert meta_a["snapshotSha256"] == meta_b["snapshotSha256"]


@pytest.mark.asyncio
async def test_snapshot_hash_changes_with_source_set_revision():
    source = make_source(uuid4(), "10")
    first = await freeze_task_run(
        FakeFreezeSession(),
        make_task(run_id=str(uuid4()), source_set_revision=7),
        sources_repo=source_repo(source),
    )
    second = await freeze_task_run(
        FakeFreezeSession(),
        make_task(run_id=str(uuid4()), source_set_revision=8),
        sources_repo=source_repo(source),
    )

    assert first["snapshotSha256"] != second["snapshotSha256"]


@pytest.mark.asyncio
async def test_freeze_rejects_empty_source_set():
    with pytest.raises(TaskRunFreezeError):
        await freeze_task_run(
            FakeFreezeSession(),
            make_task(),
            sources_repo=source_repo(),
        )


@pytest.mark.asyncio
async def test_freeze_rejects_invalid_run_id():
    task = make_task()
    task.execution_run_id = "not-a-uuid"
    with pytest.raises(TaskRunFreezeError):
        await freeze_task_run(FakeFreezeSession(), task)
