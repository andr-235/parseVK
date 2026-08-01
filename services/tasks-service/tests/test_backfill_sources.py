"""Tests for deterministic source and TaskRun backfill."""

import sys
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from scripts.backfill_task_sources import run_backfill

from app.db.models import MonitoringSource, Task, TaskRun, TaskSource


def make_task(task_id: int, group_ids: list[int], *, run_id: str | None = None, scope: str = "selected"):
    return SimpleNamespace(
        id=task_id,
        owner_user_id="user-1",
        group_ids=group_ids,
        execution_run_id=run_id,
        scope=scope,
        mode="recent_posts",
        post_limit=10,
        revision=5,
    )


class _NestedCtx:
    def __init__(self, session):
        self.session = session

    async def __aenter__(self):
        return self.session

    async def __aexit__(self, *args):
        return False


class FakeSession:
    def __init__(self, tasks, sources=None, links=None, runs=None):
        self.tasks = tasks
        self.sources = sources or []
        self.links = links or []
        self.runs = runs or []
        self.added = []

    def _entity(self, stmt):
        return stmt.column_descriptions[0]["entity"]

    async def scalars(self, stmt):
        entity = self._entity(stmt)
        if entity is Task:
            return list(self.tasks)
        if entity is MonitoringSource:
            return list(self.sources)
        if entity is TaskSource:
            return list(self.links)
        raise AssertionError(f"unexpected entity: {entity}")

    async def get(self, model, key):
        if model is TaskRun:
            return next((run for run in self.runs if run.id == key), None)
        return None

    def add(self, obj):
        if getattr(obj, "id", None) is None:
            obj.id = uuid4()
        self.added.append(obj)

    async def flush(self):
        return None

    def begin_nested(self):
        return _NestedCtx(self)


def session_state(session):
    sources = session.sources + [o for o in session.added if isinstance(o, MonitoringSource)]
    links = session.links + [o for o in session.added if isinstance(o, TaskSource)]
    runs = session.runs + [o for o in session.added if isinstance(o, TaskRun)]
    return sources, links, runs


@pytest.mark.asyncio
async def test_dry_run_does_not_write():
    session = FakeSession(tasks=[make_task(1, [12345, 67890])])

    summary = await run_backfill(session, dry_run=True)

    assert summary["linked"] == 2
    assert summary["runs_created"] == 0
    assert summary["errors"] == []
    assert session.added == []


@pytest.mark.asyncio
async def test_commit_creates_task_sources_and_baseline_run():
    run_id = str(uuid4())
    session = FakeSession(tasks=[make_task(1, [12345], run_id=run_id)])

    summary = await run_backfill(session, dry_run=False)

    assert summary["linked"] == 1
    assert summary["runs_created"] == 1
    task_source = next(o for o in session.added if isinstance(o, TaskSource))
    run = next(o for o in session.added if isinstance(o, TaskRun))
    assert task_source.task_id == 1
    assert str(run.id) == run_id
    assert run.source_set_snapshot[0]["externalId"] == "12345"


@pytest.mark.asyncio
async def test_rerun_is_idempotent_by_run_id():
    run_id = str(uuid4())
    session = FakeSession(tasks=[make_task(1, [12345], run_id=run_id)])
    await run_backfill(session, dry_run=False)

    sources, links, runs = session_state(session)
    second_session = FakeSession(session.tasks, sources, links, runs)
    second = await run_backfill(second_session, dry_run=False)

    assert second["linked"] == 0
    assert second["skipped"] == 1
    assert second["runs_created"] == 0


@pytest.mark.asyncio
async def test_same_external_id_is_shared_across_users():
    first = make_task(1, [12345])
    second = make_task(2, [12345])
    second.owner_user_id = "user-2"
    session = FakeSession(tasks=[first, second])

    summary = await run_backfill(session, dry_run=False)

    sources = [o for o in session.added if isinstance(o, MonitoringSource)]
    links = [o for o in session.added if isinstance(o, TaskSource)]
    assert summary["linked"] == 2
    assert len(sources) == 1
    assert len({link.source_id for link in links}) == 1


@pytest.mark.asyncio
async def test_scope_all_creates_empty_snapshot():
    session = FakeSession(
        tasks=[make_task(1, [], run_id=str(uuid4()), scope="all")]
    )

    summary = await run_backfill(session, dry_run=False)

    run = next(o for o in session.added if isinstance(o, TaskRun))
    assert summary["linked"] == 0
    assert summary["runs_created"] == 1
    assert run.source_set_snapshot == []


@pytest.mark.asyncio
async def test_invalid_run_id_fails_backfill():
    session = FakeSession(tasks=[make_task(1, [12345], run_id="broken")])

    with pytest.raises(RuntimeError, match="invalid task"):
        await run_backfill(session, dry_run=False)


@pytest.mark.asyncio
async def test_group_ids_are_preserved():
    task = make_task(1, [12345], run_id=str(uuid4()))
    await run_backfill(FakeSession(tasks=[task]), dry_run=False)
    assert task.group_ids == [12345]
