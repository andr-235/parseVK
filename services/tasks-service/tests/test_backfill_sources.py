"""Tests for backfill idempotency, dry-run vs commit, and group preservation."""

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
    """Minimal AsyncSession stand-in for backfill unit tests."""

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
        if entity is TaskRun:
            return list(self.runs)
        raise AssertionError(f"unexpected entity: {entity}")

    async def scalar(self, stmt):
        if self._entity(stmt) is TaskRun and self.runs:
            return self.runs[0]
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
    """Reconstruct tables from added objects to simulate committed state."""
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
    assert session.added == []


@pytest.mark.asyncio
async def test_commit_creates_task_sources_and_baseline_run():
    run_id = str(uuid4())
    session = FakeSession(tasks=[make_task(1, [12345], run_id=run_id)])

    summary = await run_backfill(session, dry_run=False)

    assert summary["linked"] == 1
    assert summary["runs_created"] == 1
    task_sources = [o for o in session.added if isinstance(o, TaskSource)]
    assert len(task_sources) == 1
    assert task_sources[0].task_id == 1
    runs = [o for o in session.added if isinstance(o, TaskRun)]
    assert len(runs) == 1
    assert str(runs[0].id) == run_id
    assert runs[0].source_set_snapshot[0]["externalId"] == "12345"


@pytest.mark.asyncio
async def test_rerun_is_idempotent_no_duplicates():
    run_id = str(uuid4())
    session = FakeSession(tasks=[make_task(1, [12345], run_id=run_id)])

    first = await run_backfill(session, dry_run=False)
    assert first["linked"] == 1

    sources, links, runs = session_state(session)
    session2 = FakeSession(tasks=session.tasks, sources=sources, links=links, runs=runs)

    second = await run_backfill(session2, dry_run=False)

    assert second["linked"] == 0
    assert second["skipped"] == 1
    assert second["runs_created"] == 0


@pytest.mark.asyncio
async def test_rerun_after_partial_failure_identical_summary():
    """Crash/retry: rerun after a partially committed state yields identical counts."""
    run_id = str(uuid4())
    session = FakeSession(tasks=[make_task(1, [12345, 67890], run_id=run_id)])

    first = await run_backfill(session, dry_run=False)

    sources, links, runs = session_state(session)
    session2 = FakeSession(tasks=session.tasks, sources=sources, links=links, runs=runs)
    second = await run_backfill(session2, dry_run=False)

    assert second["linked"] == 0
    assert second["runs_created"] == 0
    assert second["tasks_processed"] == first["tasks_processed"]
    assert second["skipped"] == 2


@pytest.mark.asyncio
async def test_scope_all_empty_group_ids_no_special_rows():
    run_id = str(uuid4())
    session = FakeSession(
        tasks=[make_task(1, [], run_id=run_id, scope="all")]
    )

    summary = await run_backfill(session, dry_run=False)

    assert summary["linked"] == 0
    assert summary["runs_created"] == 1
    runs = [o for o in session.added if isinstance(o, TaskRun)]
    assert runs[0].source_set_snapshot == []


@pytest.mark.asyncio
async def test_group_ids_preserved_on_task():
    run_id = str(uuid4())
    task = make_task(1, [12345], run_id=run_id)
    session = FakeSession(tasks=[task])

    await run_backfill(session, dry_run=False)

    assert task.group_ids == [12345]
