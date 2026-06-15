import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.modules.automation.router import get_automation_service


class FakeAutomationService:
    async def get_settings(self, owner_user_id):
        return {
            "enabled": False,
            "runHour": 9,
            "runMinute": 0,
            "postLimit": 10,
            "timezoneOffsetMinutes": 0,
            "lastRunAt": None,
            "nextRunAt": None,
            "isRunning": False,
        }

    async def update_settings(self, owner_user_id, payload, request_id=None, correlation_id=None):
        return {
            "enabled": payload.enabled,
            "runHour": payload.run_hour,
            "runMinute": payload.run_minute,
            "postLimit": payload.post_limit,
            "timezoneOffsetMinutes": payload.timezone_offset_minutes,
            "lastRunAt": None,
            "nextRunAt": "2026-05-08T09:00:00Z" if payload.enabled else None,
            "isRunning": False,
        }

    async def run(self, owner_user_id, request_id=None, correlation_id=None):
        return {
            "started": False,
            "reason": "Нет завершённых задач для повторного запуска",
            "settings": await self.get_settings(owner_user_id),
        }


@pytest.fixture
def app():
    app = create_app()

    async def override_automation_service():
        return FakeAutomationService()

    app.dependency_overrides[get_automation_service] = override_automation_service
    return app


def headers():
    return {"X-Internal-Service-Token": "dev-internal-token", "X-User-ID": "user-1"}


@pytest.mark.asyncio
async def test_automation_settings_route_is_not_task_id_route(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/internal/tasks/automation/settings", headers=headers())

    assert response.status_code == 200
    assert response.json()["postLimit"] == 10


@pytest.mark.asyncio
async def test_update_settings_returns_next_run_when_enabled(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/internal/tasks/automation/settings",
            headers=headers(),
            json={
                "enabled": True,
                "runHour": 9,
                "runMinute": 0,
                "postLimit": 10,
                "timezoneOffsetMinutes": 0,
            },
        )

    assert response.status_code == 200
    assert response.json()["nextRunAt"] == "2026-05-08T09:00:00Z"


@pytest.mark.asyncio
async def test_manual_run_no_completed_task_is_noop(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/internal/tasks/automation/run", headers=headers())

    assert response.status_code == 200
    assert response.json()["started"] is False
