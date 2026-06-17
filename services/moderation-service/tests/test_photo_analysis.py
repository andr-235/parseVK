import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

import app.modules.photo_analysis.service as photo_analysis_service
from app.modules.photo_analysis.schemas import AnalyzePhotosSchema


@pytest.fixture
def anyio_backend():
    return "asyncio"


class _ScalarResult:
    def __init__(self, val, rowcount=0):
        self._val = val
        self.rowcount = rowcount

    def scalar(self):
        return self._val

    def scalar_one_or_none(self):
        return self._val

    def scalars(self):
        return self

    def all(self):
        if self._val is None:
            return []
        return self._val if isinstance(self._val, list) else [self._val]


@pytest.mark.anyio
@patch.object(photo_analysis_service, "PhotoAnalysisClient")
async def test_analyze_by_vk_user_happy_path(mock_client_cls):
    session = AsyncMock()

    mock_client = AsyncMock()
    mock_client_cls.return_value = mock_client
    mock_client.prepare_photos = AsyncMock(return_value=[
        {"photo_vk_id": "999_12345", "url": "https://example.com/best.jpg", "raw": {}}
    ])
    mock_client.moderate_photos = AsyncMock(return_value=[
        {
            "has_suspicious": True,
            "suspicion_level": "MEDIUM",
            "categories": ["violence", "weapons"],
            "confidence": 85.0,
            "explanation": "Armed conflict detected",
        }
    ])
    mock_client.verify_author = AsyncMock(return_value=True)

    session.execute.return_value = _ScalarResult([])

    service = photo_analysis_service.PhotoAnalysisService(session)
    options = AnalyzePhotosSchema(limit=10, force=False)

    service.list_by_vk_user = AsyncMock()

    await service.analyze_by_vk_user(999, options)

    assert mock_client.prepare_photos.call_count == 1
    assert mock_client.moderate_photos.call_count == 1
    assert mock_client.verify_author.call_count == 1
    assert session.execute.call_count == 2  # 1 for duplicates check, 1 for insert
    assert session.commit.call_count == 1


@pytest.mark.anyio
@patch.object(photo_analysis_service, "PhotoAnalysisClient")
async def test_analyze_by_vk_user_empty_photos(mock_client_cls):
    session = AsyncMock()

    mock_client = AsyncMock()
    mock_client_cls.return_value = mock_client
    mock_client.prepare_photos = AsyncMock(return_value=[])
    mock_client.verify_author = AsyncMock(return_value=True)

    service = photo_analysis_service.PhotoAnalysisService(session)
    options = AnalyzePhotosSchema(limit=10, force=False)

    service.list_by_vk_user = AsyncMock()

    await service.analyze_by_vk_user(999, options)

    assert mock_client.prepare_photos.call_count == 1
    assert mock_client.moderate_photos.call_count == 0
    assert mock_client.verify_author.call_count == 1
    assert session.commit.call_count == 0


@pytest.mark.anyio
@patch.object(photo_analysis_service, "PhotoAnalysisClient")
async def test_analyze_by_vk_user_external_moderation_failure(mock_client_cls):
    session = AsyncMock()

    mock_client = AsyncMock()
    mock_client_cls.return_value = mock_client
    mock_client.prepare_photos = AsyncMock(return_value=[
        {"photo_vk_id": "999_12345", "url": "https://example.com/best.jpg", "raw": {}}
    ])
    mock_client.moderate_photos = AsyncMock(side_effect=RuntimeError("Webhook unavailable"))

    session.execute.return_value = _ScalarResult([])

    service = photo_analysis_service.PhotoAnalysisService(session)
    options = AnalyzePhotosSchema(limit=10, force=False)

    with pytest.raises(RuntimeError, match="Webhook unavailable"):
        await service.analyze_by_vk_user(999, options)

    assert mock_client.prepare_photos.call_count == 1
    assert mock_client.moderate_photos.call_count == 1
    assert session.commit.call_count == 0


def test_webhook_moderation_adapter_parsing():
    from app.modules.photo_analysis.adapter import WebhookModerationAdapter

    assert WebhookModerationAdapter.parse_boolean("false") is False
    assert WebhookModerationAdapter.parse_boolean("True") is True
    assert WebhookModerationAdapter.parse_boolean(True) is True
    assert WebhookModerationAdapter.parse_boolean(False) is False
    assert WebhookModerationAdapter.parse_boolean(None) is False

    assert WebhookModerationAdapter.create_suspicion_level(False, 99.0) == "NONE"
    assert WebhookModerationAdapter.create_suspicion_level(True, 95.0) == "HIGH"
    assert WebhookModerationAdapter.create_suspicion_level(True, 85.0) == "MEDIUM"
    assert WebhookModerationAdapter.create_suspicion_level(True, 65.0) == "LOW"
    assert WebhookModerationAdapter.create_suspicion_level(True, None) == "LOW"

    raw_response = {
        "is_illegal": "True",
        "confidence": 0.85,
        "category": "violence",
        "subcategory": ["weapons", "hate speech"],
        "description": "  Test violence detected  ",
    }

    adapted = WebhookModerationAdapter.adapt(raw_response)

    assert adapted["has_suspicious"] is True
    assert adapted["suspicion_level"] == "MEDIUM"
    assert set(adapted["categories"]) == {"violence", "weapons", "hate speech"}
    assert adapted["confidence"] == 85.0
    assert adapted["explanation"] == "Test violence detected"
