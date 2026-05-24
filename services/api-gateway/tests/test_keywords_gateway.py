import sys
from pathlib import Path
import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path
use_service_path()

from app.modules.keywords.service import KeywordsGatewayService


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
