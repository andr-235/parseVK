import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.modules.tasks.router import get_tasks_service


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeTasksService:
    def __init__(self):
        self.calls = []

    async def start_execution(self, task_id, payload, request_id=None, correlation_id=None):
        self.calls.append(("start", task_id, payload))
        return {"id": task_id, "status": "running", "completed": False}

    async def update_execution_progress(self, task_id, payload, request_id=None, correlation_id=None):
        self.calls.append(("progress", task_id, payload))
        return {
            "id": task_id,
            "status": "running",
            "completed": False,
            "processedItems": payload.processed_items,
            "totalItems": payload.total_items,
            "progress": payload.progress,
        }

    async def complete_execution(self, task_id, payload, request_id=None, correlation_id=None):
        self.calls.append(("complete", task_id, payload))
        return {"id": task_id, "status": "done", "completed": True}

    async def fail_execution(self, task_id, payload, request_id=None, correlation_id=None):
        self.calls.append(("fail", task_id, payload))
        return {"id": task_id, "status": "failed", "completed": False, "error": payload.error}


@pytest.fixture
def app():
    app = create_app()
    service = FakeTasksService()

    async def override_tasks_service():
        return service

    app.dependency_overrides[get_tasks_service] = override_tasks_service
    app.state.fake_tasks_service = service
    return app


def headers():
    return {
        "X-Internal-Service-Token": "dev-internal-token",
        "X-Caller-Service": "vk-service",
        "X-Request-ID": "req-1",
        "X-Correlation-ID": "corr-1",
    }


@pytest.mark.anyio
async def test_start_execution_requires_internal_auth(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/internal/tasks/1/execution/start", json={"runId": "run-1", "worker": "vk-service"})

    assert response.status_code == 403


@pytest.mark.anyio
async def test_start_execution_route(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/internal/tasks/1/execution/start",
            headers=headers(),
            json={"runId": "run-1", "worker": "vk-service"},
        )

    assert response.status_code == 200
    assert response.json()["status"] == "running"


@pytest.mark.anyio
async def test_progress_validation_rejects_processed_gt_total(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/internal/tasks/1/execution/progress",
            headers=headers(),
            json={"runId": "run-1", "processedItems": 11, "totalItems": 10, "progress": 1, "stats": {}},
        )

    assert response.status_code == 422


@pytest.mark.anyio
async def test_complete_and_fail_routes(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        complete = await client.post(
            "/internal/tasks/1/execution/complete",
            headers=headers(),
            json={"runId": "run-1", "processedItems": 10, "totalItems": 10, "stats": {"posts": 10}},
        )
        failed = await client.post(
            "/internal/tasks/2/execution/fail",
            headers=headers(),
            json={"runId": "run-2", "error": "VK API rate limit exceeded", "processedItems": 1, "totalItems": 10, "stats": {}},
        )

    assert complete.status_code == 200
    assert complete.json()["status"] == "done"
    assert failed.status_code == 200
    assert failed.json()["status"] == "failed"
