import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.background.health import WorkerHealth
from app.main import create_app


@pytest.mark.asyncio
async def test_health_returns_up():
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "UP", "outboxPublisher": "unhealthy", "automationScheduler": "unhealthy"}


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


def test_initial_state_dead():
    """New WorkerHealth is not healthy."""
    h = WorkerHealth()
    assert h.running is False
    assert h.last_success_at is None
    assert h.is_healthy is False


def test_mark_started():
    """mark_started() sets running=True but is_healthy is still False."""
    h = WorkerHealth()
    h.mark_started()
    assert h.running is True
    assert h.is_healthy is False  # no success yet


def test_mark_success():
    """mark_success() sets running=True, updates last_success_at, clears error."""
    h = WorkerHealth()
    h.mark_success()
    assert h.running is True
    assert h.last_success_at is not None
    assert h.last_error is None
    assert h.is_healthy is True


def test_mark_error():
    """mark_error() sets running=False and records the error."""
    h = WorkerHealth()
    h.mark_success()  # was healthy
    h.mark_error("something went wrong")
    assert h.running is False
    assert h.last_error == "something went wrong"
    assert h.is_healthy is False


def test_mark_stopped():
    """mark_stopped() sets running=False."""
    h = WorkerHealth()
    h.mark_started()
    h.mark_stopped()
    assert h.running is False
    assert h.is_healthy is False
