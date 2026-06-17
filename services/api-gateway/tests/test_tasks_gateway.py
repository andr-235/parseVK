"""Tests for API Gateway tasks routes."""
import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.modules.tasks.router import get_tasks_gateway_service
from app.modules.tasks.service import TasksGatewayService


class FakeTasksGatewayService:
    def __init__(self):
        self.calls = []

    async def forward(self, request, method, path, *, json=None, params=None):
        self.calls.append(
            {
                "method": method,
                "path": path,
                "json": json,
                "params": params,
                "authorization": request.headers.get("Authorization"),
            }
        )
        if path == "/internal/tasks/automation/settings":
            return {"postLimit": 10}
        if path == "/internal/tasks":
            return {"tasks": [], "total": 0, "page": 1, "limit": 20, "totalPages": 0, "hasMore": False}
        return {"id": 1}


@pytest.fixture
def fake_service():
    return FakeTasksGatewayService()


@pytest.fixture
def app(fake_service):
    app = create_app()

    async def override_tasks_gateway_service():
        return fake_service

    app.dependency_overrides[get_tasks_gateway_service] = override_tasks_gateway_service
    return app


@pytest.mark.asyncio
async def test_automation_settings_route_does_not_hit_task_id_route(app, fake_service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/v1/tasks/automation/settings",
            headers={"Authorization": "Bearer token"},
        )

    assert response.status_code == 200
    assert response.json() == {"postLimit": 10}
    assert fake_service.calls[0]["path"] == "/internal/tasks/automation/settings"


@pytest.mark.asyncio
async def test_create_task_forwards_to_internal_parse(app, fake_service):
    payload = {"scope": "all", "groupIds": [1], "postLimit": 10, "mode": "recent_posts"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/tasks/parse",
            headers={"Authorization": "Bearer token"},
            json=payload,
        )

    assert response.status_code == 200
    assert fake_service.calls[0]["method"] == "POST"
    assert fake_service.calls[0]["path"] == "/internal/tasks/parse"
    assert fake_service.calls[0]["json"] == payload


class FakeAuthService:
    async def validate_token(self, access_token):
        assert access_token == "token"
        return {"sub": "user-42"}


class FakeTasksClient:
    def __init__(self):
        self.last_user_id = None

    async def request(self, method, path, *, user_id, request_id=None, correlation_id=None, json=None, params=None, files=None):
        self.last_user_id = user_id
        return {"ok": True}


class FakeRequest:
    headers = {"Authorization": "Bearer token"}


@pytest.mark.asyncio
async def test_service_forwards_user_id_from_access_token_claims():
    tasks_client = FakeTasksClient()
    service = TasksGatewayService(tasks_client, FakeAuthService())

    response = await service.forward(FakeRequest(), "GET", "/internal/tasks")

    assert response == {"ok": True}
    assert tasks_client.last_user_id == "user-42"
