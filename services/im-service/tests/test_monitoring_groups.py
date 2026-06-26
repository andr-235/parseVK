import pytest
from app.db.session import get_session
from httpx import ASGITransport, AsyncClient

HEADERS = {
    "X-Internal-Service-Token": "dev-internal-token",
    "X-User-ID": "user-1",
}


@pytest.fixture
def app(mock_db_session):
    from app.main import create_app
    app = create_app()
    app.dependency_overrides[get_session] = lambda: mock_db_session
    return app


@pytest.mark.asyncio
async def test_list_groups_requires_internal_token(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/internal/monitoring/groups")
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_groups_empty(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/internal/monitoring/groups",
            headers=HEADERS,
            params={"messenger": "whatsapp"},
        )
        assert resp.status_code == 200
        assert resp.json() == []


@pytest.mark.asyncio
async def test_create_group_requires_auth(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/internal/monitoring/groups",
            json={"messenger": "whatsapp", "chat_id": "chat-1", "name": "Test Group"},
        )
        assert resp.status_code == 400


@pytest.mark.asyncio
async def test_create_group_duplicate_returns_409(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/internal/monitoring/groups",
            headers=HEADERS,
            json={"messenger": "whatsapp", "chat_id": "chat-1", "name": "Test Group", "category": "work"},
        )
        assert resp.status_code == 409


@pytest.mark.asyncio
async def test_update_group_returns_404_for_missing(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.patch(
            "/internal/monitoring/groups/999",
            headers=HEADERS,
            json={"name": "Updated"},
        )
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_group_returns_404_for_missing(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.delete(
            "/internal/monitoring/groups/999",
            headers=HEADERS,
        )
        assert resp.status_code == 404
