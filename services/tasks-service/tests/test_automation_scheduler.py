import asyncio
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.db.models import TaskAutomationSettings
from app.main import _automation_scheduler_health, create_app
from app.modules.automation.service import AutomationService


def make_settings(
    enabled: bool = True,
    run_hour: int = 9,
    run_minute: int = 0,
    timezone_offset_minutes: int = 0,
    last_run_at: datetime | None = None,
    owner_user_id: str = "user-1",
) -> TaskAutomationSettings:
    return TaskAutomationSettings(
        enabled=enabled,
        run_hour=run_hour,
        run_minute=run_minute,
        timezone_offset_minutes=timezone_offset_minutes,
        last_run_at=last_run_at,
        owner_user_id=owner_user_id,
    )


NOW = datetime(2026, 6, 23, 14, 30, 0, 0, tzinfo=UTC)


@pytest.mark.asyncio
async def test_check_and_run_due_disabled_skips():
    service = AutomationService(
        session=MagicMock(),
        repository=MagicMock(),
        tasks=MagicMock(),
        outbox=MagicMock(),
    )
    service.run = AsyncMock()
    settings = make_settings(enabled=False)

    await service.check_and_run_due(settings, _now=NOW)

    service.run.assert_not_called()


@pytest.mark.asyncio
async def test_check_and_run_due_future_time_skips():
    service = AutomationService(
        session=MagicMock(),
        repository=MagicMock(),
        tasks=MagicMock(),
        outbox=MagicMock(),
    )
    service.run = AsyncMock()
    settings = make_settings(run_hour=16, run_minute=0)

    await service.check_and_run_due(settings, _now=NOW)

    service.run.assert_not_called()


@pytest.mark.asyncio
async def test_check_and_run_due_past_time_runs():
    repository = MagicMock()
    repository.has_active_automation_task = AsyncMock(return_value=False)
    service = AutomationService(
        session=MagicMock(),
        repository=repository,
        tasks=MagicMock(),
        outbox=MagicMock(),
    )
    service.run = AsyncMock()
    settings = make_settings(run_hour=9, run_minute=0, timezone_offset_minutes=0, last_run_at=None)

    await service.check_and_run_due(settings, _now=NOW)

    service.run.assert_awaited_once_with("user-1")


@pytest.mark.asyncio
async def test_check_and_run_due_already_ran_today_skips():
    repository = MagicMock()
    repository.has_active_automation_task = AsyncMock(return_value=False)
    service = AutomationService(
        session=MagicMock(),
        repository=repository,
        tasks=MagicMock(),
        outbox=MagicMock(),
    )
    service.run = AsyncMock()
    last_run_at = NOW - timedelta(hours=1)
    settings = make_settings(run_hour=9, run_minute=45, timezone_offset_minutes=0, last_run_at=last_run_at)

    await service.check_and_run_due(settings, _now=NOW)

    service.run.assert_not_called()


@pytest.mark.asyncio
async def test_check_and_run_due_active_task_skips():
    repository = MagicMock()
    repository.has_active_automation_task = AsyncMock(return_value=True)
    service = AutomationService(
        session=MagicMock(),
        repository=repository,
        tasks=MagicMock(),
        outbox=MagicMock(),
    )
    service.run = AsyncMock()
    settings = make_settings(run_hour=9, run_minute=0, timezone_offset_minutes=0, last_run_at=None)

    await service.check_and_run_due(settings, _now=NOW)

    service.run.assert_not_called()


@pytest.mark.asyncio
async def test_health_reports_automation_scheduler():
    app = create_app()
    _automation_scheduler_health.mark_success()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["automationScheduler"] == "healthy"


@pytest.mark.asyncio
async def test_different_owners_use_different_sessions(monkeypatch):
    """Two owners are processed in separate AsyncSession instances."""
    from app.background import automation_worker

    sessions_used = []

    class _FakeTransaction:
        def __init__(self, session):
            self.session = session

        async def __aenter__(self):
            return self.session

        async def __aexit__(self, exc_type, exc, tb):
            return False

    class FakeSession:
        def __init__(self):
            self.id = id(self)

        async def __aenter__(self):
            sessions_used.append(self)
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        def begin(self):
            return _FakeTransaction(self)

    owner_ids_called = False

    class FakeRepo:
        def __init__(self, session):
            self.session = session

        async def list_enabled_owner_ids(self):
            nonlocal owner_ids_called
            owner_ids_called = True
            return ["user-1", "user-2"]

        async def get_settings_by_owner(self, owner_id):
            return make_settings(enabled=True, owner_user_id=owner_id)

    class FakeFactory:
        def __init__(self, session, *, producer=None, on_task_complete=None):
            self.session = session

        def create_automation_service(self):
            svc = AsyncMock()
            svc.check_and_run_due = AsyncMock()
            return svc

    monkeypatch.setattr(automation_worker, "SessionLocal", FakeSession)
    monkeypatch.setattr(automation_worker, "AutomationRepository", FakeRepo)
    monkeypatch.setattr(automation_worker, "ApplicationFactory", FakeFactory)

    async def sleep_and_stop(seconds):
        raise asyncio.CancelledError

    monkeypatch.setattr(automation_worker.asyncio, "sleep", sleep_and_stop)

    with pytest.raises(asyncio.CancelledError):
        await automation_worker.run_automation_scheduler_forever()

    assert owner_ids_called, "list_enabled_owner_ids should have been called"
    # sessions_used should contain at least 3 sessions:
    # 1 for list_enabled_owner_ids + 2 for the two owners
    assert len(sessions_used) >= 3, f"Expected at least 3 sessions, got {len(sessions_used)}"
    # The two owners should have different session objects
    assert sessions_used[1] is not sessions_used[2], "Owners should use different session objects"


@pytest.mark.asyncio
async def test_one_owner_error_does_not_affect_others(monkeypatch):
    """First owner's check_and_run_due raises, second still processed."""
    from app.background import automation_worker

    processed_owners = []

    class FakeSession:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        def begin(self):
            return self

    class FakeRepo:
        def __init__(self, session):
            self.session = session

        async def list_enabled_owner_ids(self):
            return ["user-1", "user-2"]

        async def get_settings_by_owner(self, owner_id):
            return make_settings(enabled=True, owner_user_id=owner_id)

    class FakeFactory:
        def __init__(self, session, *, producer=None, on_task_complete=None):
            self.session = session

        def create_automation_service(self):
            svc = AsyncMock()

            async def check_and_run_due(settings):
                processed_owners.append(settings.owner_user_id)
                if settings.owner_user_id == "user-1":
                    raise RuntimeError("user-1 failed")

            svc.check_and_run_due = check_and_run_due
            return svc

    monkeypatch.setattr(automation_worker, "SessionLocal", FakeSession)
    monkeypatch.setattr(automation_worker, "AutomationRepository", FakeRepo)
    monkeypatch.setattr(automation_worker, "ApplicationFactory", FakeFactory)

    async def sleep_and_stop(seconds):
        raise asyncio.CancelledError

    monkeypatch.setattr(automation_worker.asyncio, "sleep", sleep_and_stop)

    with pytest.raises(asyncio.CancelledError):
        await automation_worker.run_automation_scheduler_forever()

    assert "user-1" in processed_owners, "user-1 should have been processed"
    assert "user-2" in processed_owners, "user-2 should also have been processed despite user-1 error"
    assert len(processed_owners) == 2, f"Expected 2 owners processed, got {len(processed_owners)}"


@pytest.mark.asyncio
async def test_settings_reloaded_inside_user_transaction(monkeypatch):
    """get_settings_by_owner is called inside the user's session."""
    from app.background import automation_worker

    get_settings_calls = []

    class FakeSession:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        def begin(self):
            return self

    class FakeRepo:
        def __init__(self, session):
            self.session = session

        async def list_enabled_owner_ids(self):
            return ["user-1"]

        async def get_settings_by_owner(self, owner_id):
            get_settings_calls.append(owner_id)
            return make_settings(enabled=True, owner_user_id=owner_id)

    class FakeFactory:
        def __init__(self, session, *, producer=None, on_task_complete=None):
            self.session = session

        def create_automation_service(self):
            svc = AsyncMock()
            svc.check_and_run_due = AsyncMock()
            return svc

    monkeypatch.setattr(automation_worker, "SessionLocal", FakeSession)
    monkeypatch.setattr(automation_worker, "AutomationRepository", FakeRepo)
    monkeypatch.setattr(automation_worker, "ApplicationFactory", FakeFactory)

    async def sleep_and_stop(seconds):
        raise asyncio.CancelledError

    monkeypatch.setattr(automation_worker.asyncio, "sleep", sleep_and_stop)

    with pytest.raises(asyncio.CancelledError):
        await automation_worker.run_automation_scheduler_forever()

    assert len(get_settings_calls) >= 1, "get_settings_by_owner should have been called"
    assert "user-1" in get_settings_calls


@pytest.mark.asyncio
async def test_disabled_settings_not_processed(monkeypatch):
    """list_enabled_owner_ids returns only enabled owners."""
    from app.background import automation_worker

    processed = []

    class FakeSession:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        def begin(self):
            return self

    class FakeRepo:
        def __init__(self, session):
            self.session = session

        async def list_enabled_owner_ids(self):
            return ["user-1"]  # user-2 is not returned (disabled)

        async def get_settings_by_owner(self, owner_id):
            return make_settings(enabled=True, owner_user_id=owner_id)

    class FakeFactory:
        def __init__(self, session, *, producer=None, on_task_complete=None):
            self.session = session

        def create_automation_service(self):
            svc = AsyncMock()

            async def check_and_run_due(settings):
                processed.append(settings.owner_user_id)

            svc.check_and_run_due = check_and_run_due
            return svc

    monkeypatch.setattr(automation_worker, "SessionLocal", FakeSession)
    monkeypatch.setattr(automation_worker, "AutomationRepository", FakeRepo)
    monkeypatch.setattr(automation_worker, "ApplicationFactory", FakeFactory)

    async def sleep_and_stop(seconds):
        raise asyncio.CancelledError

    monkeypatch.setattr(automation_worker.asyncio, "sleep", sleep_and_stop)

    with pytest.raises(asyncio.CancelledError):
        await automation_worker.run_automation_scheduler_forever()

    assert "user-1" in processed
    assert "user-2" not in processed, "Disabled user should not be processed"


@pytest.mark.asyncio
async def test_max_owners_per_cycle_limit(monkeypatch):
    """MAX_OWNERS_PER_CYCLE limits how many owners are processed per cycle."""
    from app.background import automation_worker

    processed = []

    class FakeSession:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        def begin(self):
            return self

    # Return 200 owner IDs, but MAX_OWNERS_PER_CYCLE is 100
    all_owners = [f"user-{i}" for i in range(200)]

    class FakeRepo:
        def __init__(self, session):
            self.session = session

        async def list_enabled_owner_ids(self):
            return all_owners

        async def get_settings_by_owner(self, owner_id):
            return make_settings(enabled=True, owner_user_id=owner_id)

    class FakeFactory:
        def __init__(self, session, *, producer=None, on_task_complete=None):
            self.session = session

        def create_automation_service(self):
            svc = AsyncMock()

            async def check_and_run_due(settings):
                processed.append(settings.owner_user_id)

            svc.check_and_run_due = check_and_run_due
            return svc

    monkeypatch.setattr(automation_worker, "SessionLocal", FakeSession)
    monkeypatch.setattr(automation_worker, "AutomationRepository", FakeRepo)
    monkeypatch.setattr(automation_worker, "ApplicationFactory", FakeFactory)

    async def sleep_and_stop(seconds):
        raise asyncio.CancelledError

    monkeypatch.setattr(automation_worker.asyncio, "sleep", sleep_and_stop)

    with pytest.raises(asyncio.CancelledError):
        await automation_worker.run_automation_scheduler_forever()

    assert len(processed) <= 100, f"Should process at most 100 owners, got {len(processed)}"
    assert len(processed) == 100, f"Should process exactly 100 owners when 200 are available, got {len(processed)}"
