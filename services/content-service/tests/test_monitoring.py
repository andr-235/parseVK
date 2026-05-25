import sys
from datetime import datetime, timezone
from pathlib import Path
import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.modules.monitoring.router import get_monitoring_service
from app.modules.monitoring.schemas import (
    MonitoringGroupResponse,
    MonitoringGroupsResponse,
    MonitorMessagesResponse,
)


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

    async def create_group(self, dto):
        self.calls.append(("create_group", dto))
        return {
            "id": 1,
            "messenger": dto.messenger,
            "chat_id": dto.chat_id,
            "name": dto.name,
            "category": dto.category,
            "created_at": "2026-05-25T12:00:00Z",
            "updated_at": "2026-05-25T12:00:00Z"
        }

    async def update_group(self, id, dto):
        self.calls.append(("update_group", id, dto))
        return {
            "id": id,
            "messenger": dto.messenger or "whatsapp",
            "chat_id": dto.chat_id or "123",
            "name": dto.name or "Updated Group",
            "category": dto.category or "work",
            "created_at": "2026-05-25T12:00:00Z",
            "updated_at": "2026-05-25T12:00:00Z"
        }

    async def delete_group(self, id):
        self.calls.append(("delete_group", id))
        return {"success": True, "id": id}


@pytest.fixture
def service():
    return FakeMonitoringService()


@pytest.fixture
def app(service):
    app = create_app()

    async def service_override():
        return service

    app.dependency_overrides[get_monitoring_service] = service_override
    return app


@pytest.mark.anyio
async def test_get_messages(app, service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/monitoring/messages?keywords=test&limit=10&page=1")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["text"] == "test message"
    assert service.calls[0][0] == "get_messages"


@pytest.mark.anyio
async def test_get_groups(app, service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/monitoring/groups?messenger=whatsapp&category=work")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Group 1"
    assert service.calls[0][0] == "get_groups"


@pytest.mark.anyio
async def test_create_group(app, service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/monitoring/groups",
            json={"messenger": "max", "chat_id": "456", "name": "New Group", "category": "news"}
        )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["messenger"] == "max"
    assert service.calls[0][0] == "create_group"


@pytest.mark.anyio
async def test_update_group(app, service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.patch(
            "/monitoring/groups/5",
            json={"name": "Updated Group"}
        )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 5
    assert data["name"] == "Updated Group"
    assert service.calls[0][0] == "update_group"


@pytest.mark.anyio
async def test_delete_group(app, service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.delete("/monitoring/groups/5")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert service.calls[0] == ("delete_group", 5)
