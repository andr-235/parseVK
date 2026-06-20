import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.api.monitoring.dependencies import (
    get_monitoring_groups,
    get_monitoring_messages,
)
from app.main import create_app


class FakeMonitoringService:
    def __init__(self):
        self.calls = []

    async def get_messages(self, **kwargs):
        self.calls.append(("get_messages", kwargs))
        return {
            "items": [
                {
                    "id": "1",
                    "text": "test message",
                    "createdAt": "2026-05-25T12:00:00Z",
                    "author": "author1",
                    "chat": "chat1",
                    "source": "messages",
                    "contentUrl": None,
                    "contentType": None
                }
            ],
            "total": 1,
            "usedKeywords": kwargs.get("keywords") or ["test"],
            "lastSyncAt": "2026-05-25T12:00:00Z",
            "page": kwargs.get("page", 1),
            "limit": kwargs.get("limit", 20),
            "hasMore": False,
        }

    async def list_messages(self, **kwargs):
        return await self.get_messages(**kwargs)

    async def get_groups(self, **kwargs):
        self.calls.append(("get_groups", kwargs))
        return {
            "items": [
                {
                    "id": 1,
                    "messenger": kwargs.get("messenger") or "whatsapp",
                    "chat_id": "123",
                    "name": "Group 1",
                    "category": kwargs.get("category") or "work",
                    "created_at": "2026-05-25T12:00:00Z",
                    "updated_at": "2026-05-25T12:00:00Z"
                }
            ],
            "total": 1
        }

    async def list_groups(self, **kwargs):
        return await self.get_groups(**kwargs)

    async def create_group(self, values):
        self.calls.append(("create_group", values))
        return {
            "id": 1,
            "messenger": values["messenger"],
            "chat_id": values["chat_id"],
            "name": values["name"],
            "category": values.get("category"),
            "created_at": "2026-05-25T12:00:00Z",
            "updated_at": "2026-05-25T12:00:00Z"
        }

    async def update_group(self, id, values):
        self.calls.append(("update_group", id, values))
        return {
            "id": id,
            "messenger": values.get("messenger") or "whatsapp",
            "chat_id": values.get("chat_id") or "123",
            "name": values.get("name") or "Updated Group",
            "category": values.get("category") or "work",
            "created_at": "2026-05-25T12:00:00Z",
            "updated_at": "2026-05-25T12:00:00Z"
        }

    async def delete_group(self, id):
        self.calls.append(("delete_group", id))
        return {"success": True, "id": id}


@pytest.fixture
def monitor_service():
    return FakeMonitoringService()


@pytest.fixture
def monitor_app(monitor_service):
    app = create_app()

    async def service_override():
        return monitor_service

    app.dependency_overrides[get_monitoring_groups] = service_override
    app.dependency_overrides[get_monitoring_messages] = service_override
    return app


@pytest.mark.anyio
async def test_get_messages(monitor_app, monitor_service):
    async with AsyncClient(transport=ASGITransport(app=monitor_app), base_url="http://test") as client:
        response = await client.get("/monitoring/messages?keywords=test&limit=10&page=1")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["text"] == "test message"
    assert monitor_service.calls[0][0] == "get_messages"


@pytest.mark.anyio
async def test_get_groups(monitor_app, monitor_service):
    async with AsyncClient(transport=ASGITransport(app=monitor_app), base_url="http://test") as client:
        response = await client.get("/monitoring/groups?messenger=whatsapp&category=work")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Group 1"
    assert monitor_service.calls[0][0] == "get_groups"


@pytest.mark.anyio
async def test_create_group(monitor_app, monitor_service):
    async with AsyncClient(transport=ASGITransport(app=monitor_app), base_url="http://test") as client:
        response = await client.post(
            "/monitoring/groups",
            json={"messenger": "max", "chat_id": "456", "name": "New Group", "category": "news"}
        )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["messenger"] == "max"
    assert monitor_service.calls[0][0] == "create_group"


@pytest.mark.anyio
async def test_update_group(monitor_app, monitor_service):
    async with AsyncClient(transport=ASGITransport(app=monitor_app), base_url="http://test") as client:
        response = await client.patch(
            "/monitoring/groups/5",
            json={"name": "Updated Group"}
        )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 5
    assert data["name"] == "Updated Group"
    assert monitor_service.calls[0][0] == "update_group"


@pytest.mark.anyio
async def test_delete_group(monitor_app, monitor_service):
    async with AsyncClient(transport=ASGITransport(app=monitor_app), base_url="http://test") as client:
        response = await client.delete("/monitoring/groups/5")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert monitor_service.calls[0] == ("delete_group", 5)
