import pytest
from app.db.session import get_session
from httpx import ASGITransport, AsyncClient


@pytest.fixture
def app(mock_db_session):
    from app.main import create_app
    app = create_app()
    app.dependency_overrides[get_session] = lambda: mock_db_session
    return app


@pytest.mark.asyncio
async def test_health_returns_up(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "UP"


@pytest.mark.asyncio
async def test_internal_endpoint_rejects_missing_headers(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/internal/keywords")
        assert resp.status_code == 400


@pytest.mark.asyncio
async def test_internal_endpoint_rejects_wrong_token(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/internal/keywords",
            headers={
                "X-Internal-Service-Token": "wrong-token",
                "X-User-ID": "user-1",
            },
        )
        assert resp.status_code == 403


@pytest.mark.asyncio
async def test_internal_endpoint_requires_x_user_id(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/internal/keywords",
            headers={"X-Internal-Service-Token": "dev-internal-token"},
        )
        assert resp.status_code == 400


@pytest.mark.asyncio
async def test_search_endpoint_only_needs_internal_token(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/internal/search/messages")
        assert resp.status_code == 422
