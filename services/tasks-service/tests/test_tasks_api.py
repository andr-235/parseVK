import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.modules.tasks.router import get_tasks_service


class FakeTasksService:
    def __init__(self):
        self.created = []
        self.deleted = []

    async def create_parse_task(self, owner_user_id, payload, request_id=None, correlation_id=None):
        group_ids = [] if payload.scope == "all" else payload.group_ids
        task = {
            "id": 1,
            "title": f"VK parse: {payload.scope} / {payload.mode}",
            "description": {
                "scope": payload.scope,
                "mode": payload.mode,
                "groupIds": group_ids,
                "postLimit": payload.post_limit,
            },
            "completed": False,
            "totalItems": 0,
            "processedItems": 0,
            "progress": 0,
            "status": "pending",
            "scope": payload.scope,
            "mode": payload.mode,
            "groupIds": group_ids,
            "postLimit": payload.post_limit,
            "source": "manual",
            "stats": None,
            "error": None,
            "skippedGroupsMessage": None,
            "createdAt": "2026-05-07T12:00:00Z",
            "updatedAt": "2026-05-07T12:00:00Z",
        }
        self.created.append((owner_user_id, task))
        return task

    async def list_tasks(self, owner_user_id, page, limit):
        return {
            "tasks": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "totalPages": 0,
            "hasMore": False,
        }

    async def get_task(self, owner_user_id, task_id):
        if owner_user_id == "other":
            return None
        payload = type(
            "Payload",
            (),
            {"scope": "all", "mode": "recent_posts", "group_ids": [], "post_limit": 10},
        )()
        return await self.create_parse_task(owner_user_id, payload)

    async def get_audit_log(self, owner_user_id, task_id):
        return []

    async def resume_task(self, owner_user_id, task_id):
        return await self.get_task(owner_user_id, task_id)

    async def check_task(self, owner_user_id, task_id):
        return await self.get_task(owner_user_id, task_id)

    async def delete_task(self, owner_user_id, task_id):
        self.deleted.append((owner_user_id, task_id))


@pytest.fixture
def fake_service():
    return FakeTasksService()


@pytest.fixture
def app(fake_service):
    app = create_app()

    async def override_tasks_service():
        return fake_service

    app.dependency_overrides[get_tasks_service] = override_tasks_service
    return app


def headers(user_id="user-1"):
    return {"X-Internal-Service-Token": "dev-internal-token", "X-User-ID": user_id}


@pytest.mark.asyncio
async def test_create_scope_all_ignores_group_ids(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/internal/tasks/parse",
            headers=headers(),
            json={"scope": "all", "groupIds": [1, 2], "postLimit": 10, "mode": "recent_posts"},
        )

    assert response.status_code == 200
    assert response.json()["groupIds"] == []


@pytest.mark.asyncio
async def test_selected_scope_requires_group_ids(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/internal/tasks/parse",
            headers=headers(),
            json={"scope": "selected", "groupIds": [], "postLimit": 10, "mode": "recent_posts"},
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_uses_pagination_defaults(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/internal/tasks", headers=headers())

    assert response.status_code == 200
    assert response.json() == {
        "tasks": [],
        "total": 0,
        "page": 1,
        "limit": 20,
        "totalPages": 0,
        "hasMore": False,
    }


@pytest.mark.asyncio
async def test_missing_user_header_returns_400(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/internal/tasks",
            headers={"X-Internal-Service-Token": "dev-internal-token"},
        )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_wrong_internal_token_returns_403(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/internal/tasks",
            headers={"X-Internal-Service-Token": "wrong", "X-User-ID": "user-1"},
        )

    assert response.status_code == 403
