# ruff: noqa: E402
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.clients.base import ServiceClientHTTPError, ServiceClientUnavailableError
from app.modules.keywords.service import KeywordsGatewayService


class RecordingModerationClient:
    base_url = "http://moderation"

    def __init__(self, response: dict):
        self.response = response
        self.calls: list[dict] = []

    async def request(self, method: str, path: str, **kwargs):
        self.calls.append({"method": method, "path": path, **kwargs})
        return self.response


def test_format_keyword():
    service = KeywordsGatewayService()
    
    raw = {
        "id": 1,
        "word": "кошка",
        "category": "животные",
        "is_phrase": True,
        "created_at": "2026-05-24T12:00:00Z",
        "updated_at": "2026-05-24T12:05:00Z"
    }
    
    formatted = service._format_keyword(raw)
    
    assert formatted["id"] == 1
    assert formatted["word"] == "кошка"
    assert formatted["category"] == "животные"
    assert formatted["isPhrase"] is True
    assert formatted["createdAt"] == "2026-05-24T12:00:00Z"
    assert formatted["updatedAt"] == "2026-05-24T12:05:00Z"


def test_format_job():
    service = KeywordsGatewayService()
    
    raw = {
        "id": 1,
        "status": "pending",
        "single_keyword_id": 12,
        "started_at": "2026-05-24T12:00:00Z",
        "finished_at": None,
        "error": None,
        "requested_by": "api",
        "created_at": "2026-05-24T11:59:00Z"
    }
    
    formatted = service._format_job(raw)
    
    assert formatted["id"] == 1
    assert formatted["status"] == "pending"
    assert formatted["singleKeywordId"] == 12
    assert formatted["startedAt"] == "2026-05-24T12:00:00Z"
    assert formatted["finishedAt"] is None
    assert formatted["error"] is None
    assert formatted["requestedBy"] == "api"
    assert formatted["createdAt"] == "2026-05-24T11:59:00Z"


class DummyFile:
    def __init__(self, filename: str, content: bytes):
        self.filename = filename
        self.content = content

    async def read(self) -> bytes:
        return self.content


@pytest.mark.asyncio
async def test_upload_keywords_validations():
    service = KeywordsGatewayService()
    
    # 1. Пустое имя файла
    empty_name_file = DummyFile("", b"content")
    with pytest.raises(HTTPException) as exc_info:
        await service.upload_keywords(empty_name_file)
    assert exc_info.value.status_code == 400
    assert "Empty filename" in exc_info.value.detail

    # 2. Пустой файл
    empty_content_file = DummyFile("test.txt", b"")
    with pytest.raises(HTTPException) as exc_info:
        await service.upload_keywords(empty_content_file)
    assert exc_info.value.status_code == 400
    assert "Uploaded file is empty" in exc_info.value.detail

    # 3. Превышение лимита 5 МБ
    huge_file = DummyFile("test.txt", b"a" * (5 * 1024 * 1024 + 1))
    with pytest.raises(HTTPException) as exc_info:
        await service.upload_keywords(huge_file)
    assert exc_info.value.status_code == 400
    assert "exceeds 5MB size limit" in exc_info.value.detail

    # 4. Некорректная кодировка (не UTF-8)
    invalid_encoding_file = DummyFile("test.txt", b"\x80\x81\x82")
    with pytest.raises(HTTPException) as exc_info:
        await service.upload_keywords(invalid_encoding_file)
    assert exc_info.value.status_code == 400
    assert "encoding must be UTF-8" in exc_info.value.detail


@pytest.mark.asyncio
async def test_add_keyword_uses_typed_client_payload_and_context():
    moderation_client = RecordingModerationClient(
        {
            "id": 1,
            "word": "cat",
            "category": "animals",
            "is_phrase": False,
            "created_at": "2026-05-24T12:00:00Z",
            "updated_at": "2026-05-24T12:00:00Z",
        }
    )
    service = KeywordsGatewayService(client=moderation_client)

    result = await service.add_keyword(
        {"word": "cat", "category": "animals", "isPhrase": False},
        user_id="user-1",
        request_id="req-1",
        correlation_id="corr-1",
    )

    assert result["word"] == "cat"
    assert moderation_client.calls == [{
        "method": "POST",
        "path": "/internal/moderation/keywords/add",
        "user_id": "user-1",
        "request_id": "req-1",
        "correlation_id": "corr-1",
        "params": None,
        "json": {
            "word": "cat",
            "category": "animals",
            "is_phrase": False,
        },
    }]


@pytest.mark.asyncio
async def test_keywords_preserves_upstream_http_status_detail():
    class FailingModerationClient:
        base_url = "http://moderation"

        async def request(self, method: str, path: str, **kwargs):
            raise ServiceClientHTTPError(service_name="Moderation", status_code=404, detail={"detail": "missing"})

    service = KeywordsGatewayService(client=FailingModerationClient())

    with pytest.raises(HTTPException) as exc_info:
        await service.delete_keyword(99)

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "missing"


@pytest.mark.asyncio
async def test_keywords_maps_unavailable_upstream_to_503():
    class UnavailableModerationClient:
        base_url = "http://moderation"

        async def request(self, method: str, path: str, **kwargs):
            raise ServiceClientUnavailableError(service_name="Moderation")

    service = KeywordsGatewayService(client=UnavailableModerationClient())

    with pytest.raises(HTTPException) as exc_info:
        await service.get_all_keywords(page=1, limit=50)

    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "Moderation service unavailable"
