import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.main import create_app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_health_returns_up():
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "UP",
        "vkTokenConfigured": "no",
        "vkTokenMasked": "",
        "okCredentialsConfigured": "no",
        "okTokenMasked": "",
        "kafkaConsumer": "unhealthy",
        "outboxPublisher": "unhealthy",
        "taskWorker": "unhealthy",
    }


@pytest.mark.anyio
async def test_ready_returns_ready():
    from unittest.mock import AsyncMock, patch

    app = create_app()
    with patch("app.infrastructure.db.session.engine") as mock_engine:
        mock_conn = AsyncMock()
        mock_engine.connect.return_value.__aenter__.return_value = mock_conn

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "READY"}


@pytest.mark.anyio
async def test_ready_returns_service_unavailable():
    from unittest.mock import patch

    app = create_app()
    with patch("app.infrastructure.db.session.engine") as mock_engine:
        mock_engine.connect.side_effect = Exception("Database connection error")
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/ready")

    assert response.status_code == 503
    assert "Database is not ready" in response.json()["detail"]
