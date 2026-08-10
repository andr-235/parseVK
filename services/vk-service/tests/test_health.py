import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

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
async def test_health_reports_unconfigured_provider_as_degraded(monkeypatch):
    class EmptyProviderRepository:
        async def get_by_key(self, _account_key):
            return None

    class MissingSecretProvider:
        def load(self):
            raise RuntimeError("secret is not configured")

    monkeypatch.setattr(
        "app.main.get_provider_account_repository",
        lambda _session: EmptyProviderRepository(),
    )
    monkeypatch.setattr(
        "app.main.get_secret_provider",
        lambda: MissingSecretProvider(),
    )
    app = create_app()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "DEGRADED",
        "vkTokenConfigured": "no",
        "vkTokenMasked": "",
        "vkAccountStatus": "unconfigured",
        "okCredentialsConfigured": "no",
        "okTokenMasked": "",
        "kafkaConsumer": "disabled",
        "ingestionAckConsumer": "disabled",
        "outboxPublisher": "disabled",
        "stagedPartPublisher": "disabled",
        "executionWorker": "blocked",
    }


@pytest.mark.anyio
async def test_ready_returns_ready():
    app = create_app()
    with patch("app.infrastructure.db.session.engine") as mock_engine:
        mock_conn = AsyncMock()
        mock_engine.connect.return_value.__aenter__.return_value = mock_conn

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "READY"}


@pytest.mark.anyio
async def test_ready_rejects_unhealthy_staged_kafka(monkeypatch):
    monkeypatch.setattr(
        "app.main.settings.staged_part_publisher_enabled",
        True,
    )
    monkeypatch.setattr(
        "app.main.get_staged_part_publisher_healthy",
        lambda: False,
    )
    app = create_app()

    with patch("app.infrastructure.db.session.engine") as mock_engine:
        mock_conn = AsyncMock()
        mock_engine.connect.return_value.__aenter__.return_value = mock_conn
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/ready")

    assert response.status_code == 503
    assert response.json()["detail"] == (
        "Staged ingestion Kafka topology is not ready"
    )
    mock_engine.connect.assert_not_called()


@pytest.mark.anyio
async def test_ready_returns_service_unavailable():
    app = create_app()
    with patch("app.infrastructure.db.session.engine") as mock_engine:
        mock_engine.connect.side_effect = Exception("Database connection error")
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/ready")

    assert response.status_code == 503
    assert "Database is not ready" in response.json()["detail"]
