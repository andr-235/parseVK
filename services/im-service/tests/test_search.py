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
async def test_search_messages_requires_auth(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/internal/search/messages")
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_search_by_keywords_requires_auth(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/internal/search/messages/by-keywords")
        assert resp.status_code == 400


@pytest.mark.asyncio
async def test_search_messages_empty_result_with_mock(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/internal/search/messages",
            headers=HEADERS,
            params={"messenger": "whatsapp", "q": "nonexistent"},
        )
        assert resp.status_code == 200


@pytest.mark.asyncio
async def test_search_messages_pagination_params(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/internal/search/messages",
            headers=HEADERS,
            params={"page": "2", "limit": "10"},
        )
        assert resp.status_code == 200
