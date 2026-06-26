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
async def test_notifier_endpoints_require_auth(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/internal/notifier/state", params={"messenger": "whatsapp"})
        assert resp.status_code == 400

        resp = await client.put(
            "/internal/notifier/state",
            json={"messenger": "whatsapp", "last_seen_message_id": 1},
        )
        assert resp.status_code == 400

        resp = await client.get("/internal/notifier/new-messages", params={"messenger": "whatsapp"})
        assert resp.status_code == 400


@pytest.mark.asyncio
async def test_notifier_requires_messenger_param(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/internal/notifier/state",
            headers=HEADERS,
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_notifier_new_messages_returns_empty(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/internal/notifier/new-messages",
            headers=HEADERS,
            params={"messenger": "whatsapp"},
        )
        assert resp.status_code == 200
