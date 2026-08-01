"""Tests for the compatibility adapter (legacy group_ids <-> task_sources)."""

import sys
from pathlib import Path
from types import SimpleNamespace

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


def make_task(*, owner_user_id: str = "user-1", task_id: int = 7):
    return SimpleNamespace(id=task_id, owner_user_id=owner_user_id)


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
async def test_write_through_with_flag_off_is_noop(monkeypatch):
    monkeypatch.setattr(settings, "source_compat_write_enabled", False)
    session = FakeCompatSession()

    await SourceCompatAdapter(session).write_through(make_task(), [12345])

    assert session.added == []
