import sys
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.api.dependencies import get_access_scope_service, get_sources_service
from app.core.config import settings
from app.main import create_app


class FakeSourcesService:
    def __init__(self):
        self.created = []
        self.attached = []
        self.detached = []

    @staticmethod
    def source_response(payload):
        return {
            "id": str(uuid4()),
            "provider": payload.provider,
            "sourceType": payload.source_type,
            "externalId": payload.external_id,
            "ownerId": -int(payload.external_id),
            "displayName": getattr(payload, "display_name", None),
            "status": "active",
            "revision": 0,
            "createdAt": "2026-08-01T12:00:00Z",
            "updatedAt": "2026-08-01T12:00:00Z",
        }

    async def list_sources(self, owner_user_id):
        return [], 0

    async def create_source(self, owner_user_id, payload):
        self.created.append((owner_user_id, payload))
        return self.source_response(payload)

    async def attach_source_to_task(self, owner_user_id, task_id, payload):
        self.attached.append((owner_user_id, task_id, payload))
        return self.source_response(payload)

    async def detach_source_from_task(self, owner_user_id, task_id, source_id):
        self.detached.append((owner_user_id, task_id, source_id))
        return True

    async def list_task_sources(self, owner_user_id, task_id):
        return []


class FakeScopeService:
    def __init__(self):
        self.created = []
        self.granted = []
        self.revoked = []

    async def list_access_scopes(self, owner_user_id):
        return []

    async def create_access_scope(self, owner_user_id, payload):
        self.created.append((owner_user_id, payload))
        return {
            "id": str(uuid4()),
            "ownerUserId": owner_user_id,
            "name": payload.name,
            "createdByUserId": owner_user_id,
            "createdAt": "2026-08-01T12:00:00Z",
        }

    async def grant_access(self, owner_user_id, scope_id, payload):
        self.granted.append((owner_user_id, scope_id, payload))

    async def revoke_access(self, owner_user_id, scope_id, payload):
        self.revoked.append((owner_user_id, scope_id, payload))


@pytest.fixture
def fake_service():
    return FakeSourcesService()


@pytest.fixture
def fake_scope_service():
    return FakeScopeService()


@pytest.fixture
def app_with_sources(monkeypatch, fake_service, fake_scope_service):
    monkeypatch.setattr(settings, "sources_api_enabled", True)
    app = create_app()

    async def override_sources_service():
        return fake_service

    async def override_scope_service():
        return fake_scope_service

    app.dependency_overrides[get_sources_service] = override_sources_service
    app.dependency_overrides[get_access_scope_service] = override_scope_service
    return app


@pytest.fixture
def app_without_sources(monkeypatch):
    monkeypatch.setattr(settings, "sources_api_enabled", False)
    return create_app()


def headers(user_id="user-1"):
    return {"X-Internal-Service-Token": "dev-internal-token", "X-User-ID": user_id}


@pytest.mark.asyncio
async def test_sources_api_disabled_returns_404(app_without_sources):
    async with AsyncClient(
        transport=ASGITransport(app=app_without_sources), base_url="http://test"
    ) as client:
        response = await client.post(
            "/internal/sources",
            headers=headers(),
            json={"provider": "vk", "sourceType": "community", "externalId": "12345"},
        )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_source_when_enabled(app_with_sources, fake_service):
    async with AsyncClient(
        transport=ASGITransport(app=app_with_sources), base_url="http://test"
    ) as client:
        response = await client.post(
            "/internal/sources",
            headers=headers(),
            json={"provider": "vk", "sourceType": "community", "externalId": "12345"},
        )
    assert response.status_code == 200
    assert response.json()["ownerId"] == -12345
    assert fake_service.created[0][0] == "user-1"


@pytest.mark.asyncio
async def test_create_source_rejects_non_numeric_external_id(app_with_sources):
    async with AsyncClient(
        transport=ASGITransport(app=app_with_sources), base_url="http://test"
    ) as client:
        response = await client.post(
            "/internal/sources",
            headers=headers(),
            json={"provider": "vk", "sourceType": "community", "externalId": "abc"},
        )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_attach_task_source(app_with_sources, fake_service):
    async with AsyncClient(
        transport=ASGITransport(app=app_with_sources), base_url="http://test"
    ) as client:
        response = await client.post(
            "/internal/tasks/1/sources",
            headers=headers(),
            json={
                "provider": "vk",
                "sourceType": "community",
                "externalId": "12345",
                "kind": "target",
            },
        )
    assert response.status_code == 200
    assert response.json()["externalId"] == "12345"
    assert fake_service.attached[0][1] == 1


@pytest.mark.asyncio
async def test_detach_task_source_is_idempotent(app_with_sources, fake_service):
    source_id = uuid4()
    async with AsyncClient(
        transport=ASGITransport(app=app_with_sources), base_url="http://test"
    ) as client:
        response = await client.delete(
            f"/internal/tasks/1/sources/{source_id}",
            headers=headers(),
        )
    assert response.status_code == 204
    assert fake_service.detached == [("user-1", 1, source_id)]


@pytest.mark.asyncio
async def test_list_sources_when_enabled(app_with_sources):
    async with AsyncClient(
        transport=ASGITransport(app=app_with_sources), base_url="http://test"
    ) as client:
        response = await client.get("/internal/sources", headers=headers())
    assert response.status_code == 200
    assert response.json() == {"sources": [], "total": 0}


@pytest.mark.asyncio
async def test_create_access_scope(app_with_sources, fake_scope_service):
    async with AsyncClient(
        transport=ASGITransport(app=app_with_sources), base_url="http://test"
    ) as client:
        response = await client.post(
            "/internal/access-scopes",
            headers=headers(),
            json={"name": "Main scope"},
        )
    assert response.status_code == 200
    assert response.json()["createdByUserId"] == "user-1"
    assert fake_scope_service.created[0][0] == "user-1"


@pytest.mark.asyncio
async def test_grant_access(app_with_sources, fake_scope_service):
    scope_id = str(uuid4())
    async with AsyncClient(
        transport=ASGITransport(app=app_with_sources), base_url="http://test"
    ) as client:
        response = await client.post(
            f"/internal/access-scopes/{scope_id}/grant",
            headers=headers(),
            json={"provider": "vk", "sourceType": "community", "externalId": "12345"},
        )
    assert response.status_code == 200
    assert response.json() == {"status": "granted"}
    assert fake_scope_service.granted[0][1] == UUID(scope_id)


@pytest.mark.asyncio
async def test_revoke_access(app_with_sources, fake_scope_service):
    scope_id = str(uuid4())
    async with AsyncClient(
        transport=ASGITransport(app=app_with_sources), base_url="http://test"
    ) as client:
        response = await client.post(
            f"/internal/access-scopes/{scope_id}/revoke",
            headers=headers(),
            json={"provider": "vk", "sourceType": "community", "externalId": "12345"},
        )
    assert response.status_code == 200
    assert response.json() == {"status": "revoked"}
    assert fake_scope_service.revoked[0][1] == UUID(scope_id)
