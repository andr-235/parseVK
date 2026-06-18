import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.api.schemas.ok_friends import JobStatus
from app.core.config import settings
from app.infrastructure.db.repositories.ok_friends import SqlAlchemyOkFriendsRepository
from app.infrastructure.ok_client.client import OkApiClient
from app.main import create_app
from app.services.ok_friends_service import OkFriendsExportService


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
def repo(db_session) -> SqlAlchemyOkFriendsRepository:
    return SqlAlchemyOkFriendsRepository(db_session)


@pytest.fixture
def service(repo) -> OkFriendsExportService:
    ok_client = OkApiClient()
    return OkFriendsExportService(repo=repo, ok_client=ok_client)


@pytest.mark.anyio
async def test_create_and_get_job(repo: SqlAlchemyOkFriendsRepository):
    params = {"fid": "12345"}
    job = await repo.create_job(params, ok_user_id=12345)
    
    assert job.id is not None
    assert job.status == JobStatus.RUNNING.value
    assert job.params == params
    assert job.ok_user_id == 12345
    assert job.fetched_count == 0

    fetched = await repo.get_job_by_id(job.id)
    assert fetched is not None
    assert fetched.id == job.id
    
    logs = await repo.get_job_logs(job.id)
    assert len(logs) == 1
    assert logs[0].message == "Export started"


@pytest.mark.anyio
async def test_update_progress_and_complete(repo: SqlAlchemyOkFriendsRepository):
    job = await repo.create_job({"fid": "111"}, ok_user_id=111)
    
    await repo.update_progress(job.id, fetched_count=15, total_count=30, warning="some warning")
    fetched = await repo.get_job_by_id(job.id)
    assert fetched.fetched_count == 15
    assert fetched.total_count == 30
    assert fetched.warning == "some warning"

    xlsx_path = "/tmp/fake_ok.xlsx"
    await repo.complete_job(job.id, fetched_count=30, total_count=30, warning=None, xlsx_path=xlsx_path)
    completed = await repo.get_job_by_id(job.id)
    assert completed.status == JobStatus.DONE.value
    assert completed.xlsx_path == xlsx_path


@pytest.mark.anyio
async def test_fail_job(repo: SqlAlchemyOkFriendsRepository):
    job = await repo.create_job({"fid": "222"}, ok_user_id=222)
    
    await repo.fail_job(job.id, error="fatal error", fetched_count=5)
    failed = await repo.get_job_by_id(job.id)
    assert failed.status == JobStatus.FAILED.value
    assert failed.error == "fatal error"
    assert failed.fetched_count == 5


@pytest.mark.anyio
async def test_run_export_job_success(repo: SqlAlchemyOkFriendsRepository, service: OkFriendsExportService):
    job = await repo.create_job({"fid": "333"}, ok_user_id=333)

    # Mock OK API clients responses
    mock_friends_response = ["444", "555", "666"]
    mock_users_info_response = [
        {"uid": "444", "first_name": "John", "last_name": "Doe"},
        {"uid": "555", "first_name": "Jane", "last_name": "Smith"},
        {"uid": "666", "first_name": "Alex", "last_name": "Jones"}
    ]
    
    mock_client = AsyncMock()
    mock_client.friends_get.return_value = mock_friends_response
    mock_client.users_get_info.return_value = mock_users_info_response

    service.ok_client = mock_client
    with patch("app.services.ok_friends_service.write_xlsx_file", return_value="/tmp/test_ok.xlsx") as mock_write:
        await service.run_export_job(job.id, {"fid": "333"})
        
        mock_client.friends_get.assert_called_once()
        mock_client.users_get_info.assert_called_once()
        mock_write.assert_called_once()
        
        # Check job final status in DB
        finished = await repo.get_job_by_id(job.id)
        assert finished.status == JobStatus.DONE.value
        assert finished.fetched_count == 3
        assert finished.total_count == 3
        assert finished.xlsx_path == "/tmp/test_ok.xlsx"

        # Check logs are populated
        logs = await repo.get_job_logs(job.id)
        messages = [log.message for log in logs]
        assert any("Export completed" in msg for msg in messages)


@pytest.mark.anyio
async def test_api_routes():
    app = create_app()
    headers = {"X-Internal-Service-Token": settings.internal_service_token}
    
    with patch("app.services.ok_friends_service.OkFriendsExportService.run_export_job", new_callable=AsyncMock):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            # Start export
            start_payload = {"params": {"fid": "777"}}
            res = await ac.post("/internal/ok/friends/export", json=start_payload, headers=headers)
            assert res.status_code == 201
            data = res.json()
            assert "jobId" in data
            assert data["status"] == JobStatus.RUNNING.value
            job_id = data["jobId"]

            # Get job details
            res_job = await ac.get(f"/internal/ok/friends/jobs/{job_id}", headers=headers)
            assert res_job.status_code == 200
            job_data = res_job.json()
            assert job_data["job"]["id"] == job_id
            assert "logs" in job_data

            # Get raw logs
            res_logs = await ac.get(f"/internal/ok/friends/jobs/{job_id}/logs/raw", headers=headers)
            assert res_logs.status_code == 200
            raw_data = res_logs.json()
            assert "job" in raw_data
            assert "logs" in raw_data
