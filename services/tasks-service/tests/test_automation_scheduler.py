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
from app.main import _automation_scheduler_healthy, create_app
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
    service = AutomationService(session=MagicMock())
    service.run = AsyncMock()
    settings = make_settings(enabled=False)

    await service.check_and_run_due(settings, _now=NOW)

    service.run.assert_not_called()


@pytest.mark.asyncio
async def test_check_and_run_due_future_time_skips():
    service = AutomationService(session=MagicMock())
    service.run = AsyncMock()
    settings = make_settings(run_hour=16, run_minute=0)

    await service.check_and_run_due(settings, _now=NOW)

    service.run.assert_not_called()


@pytest.mark.asyncio
async def test_check_and_run_due_past_time_runs():
    service = AutomationService(session=MagicMock())
    service.run = AsyncMock()
    service.repository.has_active_automation_task = AsyncMock(return_value=False)
    settings = make_settings(run_hour=9, run_minute=0, timezone_offset_minutes=0, last_run_at=None)

    await service.check_and_run_due(settings, _now=NOW)

    service.run.assert_awaited_once_with("user-1")


@pytest.mark.asyncio
async def test_check_and_run_due_already_ran_today_skips():
    service = AutomationService(session=MagicMock())
    service.run = AsyncMock()
    service.repository.has_active_automation_task = AsyncMock(return_value=False)
    last_run_at = NOW - timedelta(hours=1)
    settings = make_settings(run_hour=9, run_minute=45, timezone_offset_minutes=0, last_run_at=last_run_at)

    await service.check_and_run_due(settings, _now=NOW)

    service.run.assert_not_called()


@pytest.mark.asyncio
async def test_check_and_run_due_active_task_skips():
    service = AutomationService(session=MagicMock())
    service.run = AsyncMock()
    service.repository.has_active_automation_task = AsyncMock(return_value=True)
    settings = make_settings(run_hour=9, run_minute=0, timezone_offset_minutes=0, last_run_at=None)

    await service.check_and_run_due(settings, _now=NOW)

    service.run.assert_not_called()


@pytest.mark.asyncio
async def test_health_reports_automation_scheduler():
    app = create_app()
    _automation_scheduler_healthy[0] = True

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["automationScheduler"] == "healthy"
