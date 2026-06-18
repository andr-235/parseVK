import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.core.config import settings
from app.main import create_app
from app.modules.vk_friends.schemas import JobStatus
from app.modules.vk_friends.service import VkFriendsExportService


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
def service() -> VkFriendsExportService:
    return VkFriendsExportService()


@pytest.mark.anyio
async def test_create_and_get_job(service: VkFriendsExportService):
    params = {"user_id": 12345}
    job = await service.create_job(params, vk_user_id=12345)

    assert job.id is not None
    assert job.status == JobStatus.RUNNING.value
    assert job.params == params
    assert job.vk_user_id == 12345
    assert job.fetched_count == 0

    fetched = await service.get_job_by_id(job.id)
    assert fetched is not None
    assert fetched.id == job.id

    logs = await service.get_job_logs(job.id)
    assert len(logs) == 1
    assert logs[0].message == "Export started"


@pytest.mark.anyio
async def test_update_progress_and_complete(service: VkFriendsExportService):
    job = await service.create_job({"user_id": 111}, vk_user_id=111)

    await service.update_progress(
        job.id, fetched_count=15, total_count=30, warning="some warning"
    )
    fetched = await service.get_job_by_id(job.id)
    assert fetched.fetched_count == 15
    assert fetched.total_count == 30
    assert fetched.warning == "some warning"

    xlsx_path = "/tmp/fake.xlsx"
    await service.complete_job(
        job.id, fetched_count=30, total_count=30, warning=None, xlsx_path=xlsx_path
    )
    completed = await service.get_job_by_id(job.id)
    assert completed.status == JobStatus.DONE.value
    assert completed.xlsx_path == xlsx_path


@pytest.mark.anyio
async def test_fail_job(service: VkFriendsExportService):
    job = await service.create_job({"user_id": 222}, vk_user_id=222)

    await service.fail_job(job.id, error="fatal error", fetched_count=5)
    failed = await service.get_job_by_id(job.id)
    assert failed.status == JobStatus.FAILED.value
    assert failed.error == "fatal error"
    assert failed.fetched_count == 5


@pytest.mark.anyio
async def test_run_export_job_success(service: VkFriendsExportService):
    job = await service.create_job({"user_id": 333}, vk_user_id=333)

    # Mock VK friends_get to return paginated response
    mock_vk_response = {
        "count": 3,
        "items": [
            {"id": 444, "first_name": "John", "last_name": "Doe"},
            {"id": 555, "first_name": "Jane", "last_name": "Smith"},
            {"id": 666, "first_name": "Alex", "last_name": "Jones"},
        ],
    }

    mock_client = AsyncMock()
    mock_client.friends_get.return_value = mock_vk_response

    with patch.object(service, "_get_vk_client", return_value=mock_client), patch(
        "app.modules.vk_friends.exporter.write_xlsx_file", return_value="/tmp/test.xlsx"
    ) as mock_write:

        await service.run_export_job(job.id, {"user_id": 333})

        mock_client.friends_get.assert_called_once()
        mock_write.assert_called_once()

        # Check job final status in DB
        finished = await service.get_job_by_id(job.id)
        assert finished.status == JobStatus.DONE.value
        assert finished.fetched_count == 3
        assert finished.total_count == 3
        assert finished.xlsx_path == "/tmp/test.xlsx"

        # Check logs are populated
        logs = await service.get_job_logs(job.id)
        messages = [log.message for log in logs]
        assert "Export completed" in messages


@pytest.mark.anyio
async def test_api_routes():
    app = create_app()
    headers = {"X-Internal-Service-Token": settings.internal_service_token}

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # Start export
        start_payload = {"params": {"user_id": 777}}
        res = await ac.post(
            "/internal/vk/friends/export", json=start_payload, headers=headers
        )
        assert res.status_code == 201
        data = res.json()
        assert "jobId" in data
        assert data["status"] == JobStatus.RUNNING.value
        job_id = data["jobId"]

        # Get job details
        res_job = await ac.get(f"/internal/vk/friends/jobs/{job_id}", headers=headers)
        assert res_job.status_code == 200
        job_data = res_job.json()
        assert job_data["job"]["id"] == job_id
        assert "logs" in job_data

        # Get raw logs
        res_logs = await ac.get(
            f"/internal/vk/friends/jobs/{job_id}/logs/raw", headers=headers
        )
        assert res_logs.status_code == 200
        raw_data = res_logs.json()
        assert "job" in raw_data
        assert "logs" in raw_data
