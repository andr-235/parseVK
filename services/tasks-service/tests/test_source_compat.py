"""Tests for the compatibility adapter (legacy group_ids <-> task_sources)."""

import sys
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.core.config import settings
from app.db.models import MonitoringSource, TaskSource
from app.modules.tasks.source_compat import SourceCompatAdapter


class FakeCompatSession:
    """Minimal AsyncSession stand-in: no pre-existing sources, adds rows."""

    def __init__(self):
        self.added = []

    async def scalar(self, stmt):
        return None

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        return None

    async def refresh(self, obj):
        return obj


def make_task(
    *,
    owner_user_id: str = "user-1",
    task_id: int = 7,
    scope: str = "selected",
):
    return SimpleNamespace(
        id=task_id,
        owner_user_id=owner_user_id,
        scope=scope,
    )


@pytest.fixture(autouse=True)
def enable_compat_flag(monkeypatch):
    monkeypatch.setattr(settings, "source_compat_write_enabled", True)


@pytest.mark.asyncio
async def test_write_through_creates_sources_and_links():
    session = FakeCompatSession()
    task = make_task()

    await SourceCompatAdapter(session).write_through(task, [12345, 67890])

    sources = [o for o in session.added if isinstance(o, MonitoringSource)]
    links = [o for o in session.added if isinstance(o, TaskSource)]
    assert len(sources) == 2
    assert len(links) == 2
    by_external = {s.external_id: s for s in sources}
    assert by_external["12345"].owner_id == -12345
    assert by_external["12345"].provider == "vk"
    assert by_external["12345"].source_type == "community"
    assert by_external["12345"].owner_user_id == "user-1"
    assert by_external["67890"].owner_id == -67890
    assert all(link.task_id == 7 for link in links)


@pytest.mark.asyncio
async def test_scope_all_resolves_only_sources_visible_to_owner():
    source_1 = SimpleNamespace(id=uuid4())
    source_2 = SimpleNamespace(id=uuid4())

    class OwnerScopedRepository:
        def __init__(self):
            self.calls = []
            self.links = []

        async def list_active_sources(self, owner_user_id):
            self.calls.append(owner_user_id)
            return {
                "user-1": [source_1],
                "user-2": [source_2],
            }[owner_user_id]

        async def link_task_source(self, task_id, source_id):
            self.links.append((task_id, source_id))

    repository = OwnerScopedRepository()
    adapter = SourceCompatAdapter(FakeCompatSession())
    adapter.sources_repo = repository

    await adapter.ensure_normalized_sources(
        make_task(owner_user_id="user-1", task_id=7, scope="all"),
        [],
    )
    await adapter.ensure_normalized_sources(
        make_task(owner_user_id="user-2", task_id=8, scope="all"),
        [],
    )

    assert repository.calls == ["user-1", "user-2"]
    assert repository.links == [
        (7, source_1.id),
        (8, source_2.id),
    ]


@pytest.mark.asyncio
async def test_write_through_with_flag_off_is_noop(monkeypatch):
    monkeypatch.setattr(settings, "source_compat_write_enabled", False)
    session = FakeCompatSession()

    await SourceCompatAdapter(session).write_through(make_task(), [12345])

    assert session.added == []
