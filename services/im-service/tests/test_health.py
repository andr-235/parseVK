import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture
def app():
    from app.main import create_app

    return create_app()


@pytest.mark.asyncio
async def test_health_returns_up(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "UP"
