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
async def test_metrics_endpoint_returns_prometheus_format():
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/metrics")

    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]
    
    text = response.text
    assert "# HELP process_resident_memory_bytes" in text
    assert "# TYPE process_resident_memory_bytes gauge" in text
    assert "process_resident_memory_bytes" in text
    
    assert "nodejs_heap_size_used_bytes" in text
    assert "nodejs_heap_size_total_bytes" in text
    assert "http_requests_total" in text
    assert "tasks_total" in text
    assert "watchlist_authors_active" in text
