import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

from app.main import create_app


@pytest.mark.asyncio
async def test_health_returns_up():
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "UP"
    assert "outboxPublisher" in response.json()


@pytest.mark.asyncio
async def test_ready_returns_ready():
    from unittest.mock import AsyncMock, patch
    app = create_app()
    with patch("app.db.session.engine") as mock_engine:
        mock_conn = AsyncMock()
        mock_engine.connect.return_value.__aenter__.return_value = mock_conn
        
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "READY"}


@pytest.mark.asyncio
async def test_ready_returns_service_unavailable():
    from unittest.mock import patch
    app = create_app()
    with patch("app.db.session.engine") as mock_engine:
        mock_engine.connect.side_effect = Exception("Database connection error")
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/ready")

    assert response.status_code == 503
    assert "Database is not ready" in response.json()["detail"]
