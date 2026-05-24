import pytest
import sys
from pathlib import Path
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path
use_service_path()

from app.db.models import WatchlistSettings, WatchlistAuthor, ModerationComment
from app.modules.watchlist.service import WatchlistService
from app.modules.watchlist.schemas import WatchlistSettingsUpdateSchema, UpdateWatchlistAuthorSchema


@pytest.fixture
def anyio_backend():
    return "asyncio"


class _ScalarResult:
    def __init__(self, val):
        self._val = val

    def scalar(self):
        return self._val

    def scalar_one_or_none(self):
        return self._val

    def scalars(self):
        return self

    def all(self):
        return self._val if isinstance(self._val, list) else [self._val]


@pytest.mark.anyio
async def test_get_or_create_settings_existing():
    session = AsyncMock()
    existing = WatchlistSettings(id=1, track_all_comments=True, poll_interval_minutes=10, max_authors=30)
    session.execute.return_value = _ScalarResult(existing)

    service = WatchlistService(session)
    settings = await service.get_or_create_settings()

    assert settings.id == 1
    assert settings.track_all_comments is True
    assert settings.poll_interval_minutes == 10
    assert settings.max_authors == 30
    assert session.add.call_count == 0


@pytest.mark.anyio
async def test_get_or_create_settings_creates_default():
    session = AsyncMock()
    session.execute.return_value = _ScalarResult(None)

    service = WatchlistService(session)
    settings = await service.get_or_create_settings()

    assert settings.id == 1
    assert settings.track_all_comments is False
    assert settings.poll_interval_minutes == 5
    assert settings.max_authors == 50
    assert session.add.call_count == 1
    assert session.commit.call_count == 1


@pytest.mark.anyio
async def test_create_watchlist_author_success():
    session = AsyncMock()
    settings = WatchlistSettings(id=1)
    
    # 1. get_or_create_settings executes
    # 2. check existing author in watchlist executes
    session.execute.side_effect = [
        _ScalarResult(settings),  # settings
        _ScalarResult(None),      # existing check
    ]

    service = WatchlistService(session)
    author = await service.create_author(author_vk_id=99999)

    assert author.author_vk_id == 99999
    assert author.status == "ACTIVE"
    assert session.add.call_count == 1
    assert session.commit.call_count == 1


@pytest.mark.anyio
async def test_update_watchlist_author_status():
    session = AsyncMock()
    author = WatchlistAuthor(id=77, author_vk_id=99999, status="ACTIVE")
    session.execute.return_value = _ScalarResult(author)

    service = WatchlistService(session)
    payload = UpdateWatchlistAuthorSchema(status="STOPPED")
    updated = await service.update_author(77, payload)

    assert updated.status == "STOPPED"
    assert updated.monitoring_stopped_at is not None
    assert session.commit.call_count == 1


@pytest.mark.anyio
@patch("httpx.AsyncClient.get")
async def test_refresh_active_authors_skips_when_locked(mock_get):
    session = AsyncMock()
    # pg_try_advisory_xact_lock returns False (locked)
    session.execute.return_value = _ScalarResult(False)

    service = WatchlistService(session)
    res = await service.refresh_active_authors()

    assert res == 0
    assert session.commit.call_count == 0
