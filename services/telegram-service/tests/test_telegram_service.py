import asyncio

import pytest
from app.main import app as telegram_app
from httpx import ASGITransport, AsyncClient


@pytest.fixture
def app():
    return telegram_app


@pytest.fixture(autouse=True)
def mock_db_connection(monkeypatch):
    from unittest.mock import AsyncMock, MagicMock

    import app.db.session

    # Mock connection
    mock_conn = AsyncMock()
    mock_conn.execute.return_value = MagicMock()

    # Mock context manager connect()
    mock_connect = MagicMock()
    mock_connect.__aenter__.return_value = mock_conn

    # Mock engine
    mock_engine = MagicMock()
    mock_engine.connect.return_value = mock_connect

    monkeypatch.setattr(app.db.session, "engine", mock_engine)


@pytest.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "UP"}


@pytest.mark.asyncio
async def test_ready(client: AsyncClient):
    response = await client.get("/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "READY"}


@pytest.mark.asyncio
async def test_telegram_export_lifecycle(client: AsyncClient):
    headers = {"X-Internal-Service-Token": "dev-internal-token"}
    payload = {
        "target": "https://t.me/test_group",
        "limit": 100,
        "activeOnly": True,
        "verifyPhones": False
    }
    
    # 1. Start export job
    response = await client.post("/internal/telegram/export", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert "jobId" in data
    assert data["status"] == "pending"
    
    job_id = data["jobId"]
    
    # 2. Retrieve job details (loop until it starts/completes)
    response = await client.get(f"/internal/telegram/jobs/{job_id}", headers=headers)
    assert response.status_code == 200
    job_data = response.json()
    assert job_data["job"]["id"] == job_id
    assert len(job_data["logs"]) > 0

    # Wait for the async task to run and complete (simulated in service)
    # Since it sleeps for ~3.4s before starting the fetch loop, we wait a bit
    await asyncio.sleep(1.0)
    
    response = await client.get(f"/internal/telegram/jobs/{job_id}", headers=headers)
    assert response.status_code == 200
    job_data = response.json()
    assert job_data["job"]["status"] in ["pending", "running", "done"]

