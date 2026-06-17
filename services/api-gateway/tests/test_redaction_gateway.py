import sys
<<<<<<< HEAD
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, patch
=======
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path
<<<<<<< HEAD
use_service_path()

from app.core.config import settings
from app.core.redaction import redact_secrets
from app.clients.vk_service.client import VkServiceClientHTTPError
from app.modules.vk_friends.adapters import VkFriendsAdapter
from app.modules.ok_friends.adapters import OkFriendsAdapter
from app.modules.friends_export.service import FriendsExportService
from app.modules.friends_export.models import JobStatus
=======

use_service_path()

from app.clients.base import ServiceClientHTTPError
from app.core.config import settings
from app.core.redaction import redact_secrets
from app.modules.friends_export.service import FriendsExportService
from app.modules.ok_friends.adapters import OkFriendsAdapter
from app.modules.vk_friends.adapters import VkFriendsAdapter
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da


@pytest.fixture
def anyio_backend():
    return "asyncio"


def test_redact_secrets_gateway():
    with patch.object(settings, "internal_service_token", "super_gateway_token_123"):
        assert redact_secrets("Token is super_gateway_token_123") == "Token is <redacted>"
        
    # Check headers
    assert redact_secrets("Authorization: Bearer confidential_jwt") == "Authorization: <redacted>"
    assert redact_secrets("Cookie: auth=xyz") == "Cookie: <redacted>"
    
    # Check URL params
    assert redact_secrets("access_token=xyz&session_key=abc&sig=123") == "access_token=<redacted>&session_key=<redacted>&sig=<redacted>"
    assert redact_secrets("token=my_secret") == "token=<redacted>"
    
    # None/empty
    assert redact_secrets(None) == ""
    assert redact_secrets("") == ""


@pytest.mark.anyio
async def test_vk_adapter_redacts_errors_and_logs():
    client_mock = AsyncMock()
    
    # Setup HTTP error containing secrets
    client_mock.request.side_effect = ServiceClientHTTPError(
        service_name="VkService",
        status_code=400,
        detail="Invalid access_token=secret_vk_token_here in request"
    )
    
    adapter = VkFriendsAdapter(client=client_mock, user_id="user-1")
    
    # 1. Test start_export redaction
    with pytest.raises(HTTPException) as excinfo:
        await adapter.start_export({"user_id": 123})
    assert excinfo.value.status_code == 400
    assert "secret_vk_token_here" not in excinfo.value.detail
    assert "access_token=<redacted>" in excinfo.value.detail

    # 2. Test get_job redaction
    with pytest.raises(HTTPException) as excinfo:
        await adapter.get_job("job-123")
    assert excinfo.value.status_code == 400
    assert "secret_vk_token_here" not in excinfo.value.detail
    assert "access_token=<redacted>" in excinfo.value.detail


@pytest.mark.anyio
async def test_vk_adapter_redacts_sse_stream():
    client_mock = AsyncMock()
    
    # Return job status with error/warning containing secrets, plus logs containing secrets
    client_mock.request.return_value = {
        "job": {
            "id": "job-123",
            "status": "FAILED",
            "fetchedCount": 10,
            "totalCount": 100,
            "warning": "Sig sig=secret_sig_here was ignored",
            "error": "Failed due to session_key=secret_session_here expired",
            "xlsxPath": None,
            "createdAt": "2026-05-08T00:00:00Z"
        },
        "logs": [
            {
                "id": "log-1",
                "level": "error",
                "message": "Token access_token=secret_token_here was rejected",
                "meta": None,
                "createdAt": "2026-05-08T00:00:00Z"
            }
        ]
    }
    
    adapter = VkFriendsAdapter(client=client_mock, user_id="user-1")
    events = []
    async for event in adapter.stream_job("job-123"):
        events.append(event)
        
    # Check that events contain ONLY redacted data
    log_events = [e for e in events if e.type == "log"]
    error_events = [e for e in events if e.type == "error"]
    
    assert len(log_events) == 1
    assert "secret_token_here" not in log_events[0].data.message
    assert "access_token=<redacted>" in log_events[0].data.message
    
    assert len(error_events) == 1
    assert "secret_session_here" not in error_events[0].data.message
    assert "session_key=<redacted>" in error_events[0].data.message


@pytest.mark.anyio
async def test_ok_adapter_redacts_errors_and_logs():
    client_mock = AsyncMock()
    
    # Setup HTTP error containing secrets
    client_mock.request.side_effect = ServiceClientHTTPError(
        service_name="VkService",
        status_code=400,
        detail="Invalid access_token=secret_ok_token_here in request"
    )
    
    adapter = OkFriendsAdapter(client=client_mock, user_id="user-1")
    
    # 1. Test start_export redaction
    with pytest.raises(HTTPException) as excinfo:
        await adapter.start_export({"user_id": 123})
    assert excinfo.value.status_code == 400
    assert "secret_ok_token_here" not in excinfo.value.detail
    assert "access_token=<redacted>" in excinfo.value.detail

    # 2. Test get_job redaction
    with pytest.raises(HTTPException) as excinfo:
        await adapter.get_job("job-123")
    assert excinfo.value.status_code == 400
    assert "secret_ok_token_here" not in excinfo.value.detail
    assert "access_token=<redacted>" in excinfo.value.detail


@pytest.mark.anyio
async def test_ok_adapter_redacts_sse_stream():
    client_mock = AsyncMock()
    
    client_mock.request.return_value = {
        "job": {
            "id": "job-123",
            "status": "FAILED",
            "fetchedCount": 5,
            "totalCount": 50,
            "warning": "Sig sig=secret_sig_here was ignored",
            "error": "Failed due to session_key=secret_session_here expired",
            "xlsxPath": None,
            "createdAt": "2026-05-08T00:00:00Z"
        },
        "logs": [
            {
                "id": "log-1",
                "level": "error",
                "message": "Token access_token=secret_token_here was rejected",
                "meta": None,
                "createdAt": "2026-05-08T00:00:00Z"
            }
        ]
    }
    
    adapter = OkFriendsAdapter(client=client_mock, user_id="user-1")
    events = []
    async for event in adapter.stream_job("job-123"):
        events.append(event)
        
    log_events = [e for e in events if e.type == "log"]
    error_events = [e for e in events if e.type == "error"]
    
    assert len(log_events) == 1
    assert "secret_token_here" not in log_events[0].data.message
    assert "access_token=<redacted>" in log_events[0].data.message
    
    assert len(error_events) == 1
    assert "secret_session_here" not in error_events[0].data.message
    assert "session_key=<redacted>" in error_events[0].data.message


@pytest.mark.anyio
async def test_download_xlsx_error_handling():
    adapter_mock = AsyncMock()
    
    # 1. Test 404 (file not found or job missing) - raises HTTPException directly
    adapter_mock.get_xlsx_bytes.side_effect = HTTPException(status_code=404, detail="Job not found")
    service = FriendsExportService(adapter=adapter_mock)
    
    with pytest.raises(HTTPException) as excinfo:
        await service.download_xlsx("job-missing", "vk")
    assert excinfo.value.status_code == 404
    assert excinfo.value.detail == "Job not found"
    
    # 2. Test unexpected internal error (like FileNotFoundError on downstream or connection error)
    # It must be masked as 502 and not leak file system paths or database details!
    adapter_mock.get_xlsx_bytes.side_effect = FileNotFoundError("/var/data/exports/my_secret_path/vk_friends_123.xlsx")
    
    with pytest.raises(HTTPException) as excinfo:
        await service.download_xlsx("job-error", "vk")
    assert excinfo.value.status_code == 502
    assert "Upstream error fetching XLSX" in excinfo.value.detail
    assert "/var/data" not in excinfo.value.detail
    assert "my_secret_path" not in excinfo.value.detail
