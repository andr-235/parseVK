import pytest
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path
use_service_path()

# Import the module as an object so we can use patch.object on it directly
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
@patch.object(photo_analysis_service, "ContentServiceClient")
@patch.object(photo_analysis_service, "ImageModerationWebhookClient")
@patch.object(photo_analysis_service, "VkServiceClient")
async def test_analyze_by_vk_user_happy_path(mock_vk_cls, mock_webhook_cls, mock_content_cls):
    session = AsyncMock()
    
    # Setup VK Mock Instance
    mock_vk_inst = mock_vk_cls.return_value
    mock_vk_inst.get_user_photos = AsyncMock(return_value=[
        {
            "id": 12345,
            "photo_id": "999_12345",
            "sizes": [
                {"type": "x", "url": "https://example.com/best.jpg", "width": 604, "height": 604}
            ]
        }
    ])
    
    # Setup Webhook Mock Instance
    mock_webhook_inst = mock_webhook_cls.return_value
    mock_webhook_inst.moderate_photos = AsyncMock(return_value=[
        {
            "is_illegal": True,
            "confidence": 0.85,  # 85% confidence
            "category": ["violence"],
            "subcategory": ["weapons"],
            "description": "Armed conflict detected"
        }
    ])
    
    # Setup Content Mock Instance
    mock_content_inst = mock_content_cls.return_value
    mock_content_inst.verify_author = AsyncMock(return_value=True)

    # DB query returns no existing duplicates
    session.execute.return_value = _ScalarResult([])

    service = photo_analysis_service.PhotoAnalysisService(session)
    options = AnalyzePhotosSchema(limit=10, force=False)
    
    service.list_by_vk_user = AsyncMock()
    
    await service.analyze_by_vk_user(999, options)

    assert mock_vk_inst.get_user_photos.call_count == 1
    assert mock_webhook_inst.moderate_photos.call_count == 1
    assert mock_content_inst.verify_author.call_count == 1
    assert session.execute.call_count == 2  # 1 for duplicates check, 1 for insert
    assert session.commit.call_count == 1


@pytest.mark.anyio
@patch.object(photo_analysis_service, "ContentServiceClient")
@patch.object(photo_analysis_service, "ImageModerationWebhookClient")
@patch.object(photo_analysis_service, "VkServiceClient")
async def test_analyze_by_vk_user_empty_photos(mock_vk_cls, mock_webhook_cls, mock_content_cls):
    session = AsyncMock()
    
    mock_vk_inst = mock_vk_cls.return_value
    mock_vk_inst.get_user_photos = AsyncMock(return_value=[])
    
    mock_webhook_inst = mock_webhook_cls.return_value
    mock_webhook_inst.moderate_photos = AsyncMock()
    
    mock_content_inst = mock_content_cls.return_value
    mock_content_inst.verify_author = AsyncMock(return_value=True)

    service = photo_analysis_service.PhotoAnalysisService(session)
    options = AnalyzePhotosSchema(limit=10, force=False)
    
    service.list_by_vk_user = AsyncMock()
    
    await service.analyze_by_vk_user(999, options)

    assert mock_vk_inst.get_user_photos.call_count == 1
    assert mock_webhook_inst.moderate_photos.call_count == 0  # Should not be called
    assert mock_content_inst.verify_author.call_count == 1
    assert session.commit.call_count == 0  # Nothing committed


@pytest.mark.anyio
@patch.object(photo_analysis_service, "ImageModerationWebhookClient")
@patch.object(photo_analysis_service, "VkServiceClient")
async def test_analyze_by_vk_user_external_moderation_failure(mock_vk_cls, mock_webhook_cls):
    session = AsyncMock()
    
    mock_vk_inst = mock_vk_cls.return_value
    mock_vk_inst.get_user_photos = AsyncMock(return_value=[
        {
            "id": 12345,
            "photo_id": "999_12345",
            "sizes": [
                {"type": "x", "url": "https://example.com/best.jpg"}
            ]
        }
    ])
    
    # Mocking webhook failure
    mock_webhook_inst = mock_webhook_cls.return_value
    mock_webhook_inst.moderate_photos = AsyncMock(side_effect=RuntimeError("Webhook unavailable"))

    session.execute.return_value = _ScalarResult([])

    service = photo_analysis_service.PhotoAnalysisService(session)
    options = AnalyzePhotosSchema(limit=10, force=False)
    
    with pytest.raises(RuntimeError, match="Webhook unavailable"):
        await service.analyze_by_vk_user(999, options)

    assert mock_vk_inst.get_user_photos.call_count == 1
    assert mock_webhook_inst.moderate_photos.call_count == 1
    assert session.commit.call_count == 0  # Transaction should abort and not commit


def test_webhook_moderation_adapter_parsing():
    from app.modules.photo_analysis.adapter import WebhookModerationAdapter

    # 1. Test has_suspicious boolean parsing
    assert WebhookModerationAdapter.parse_boolean("false") is False
    assert WebhookModerationAdapter.parse_boolean("True") is True
    assert WebhookModerationAdapter.parse_boolean(True) is True
    assert WebhookModerationAdapter.parse_boolean(False) is False
    assert WebhookModerationAdapter.parse_boolean(None) is False

    # 2. Test suspicion level adapter calculations
    assert WebhookModerationAdapter.create_suspicion_level(False, 99.0) == "NONE"
    assert WebhookModerationAdapter.create_suspicion_level(True, 95.0) == "HIGH"
    assert WebhookModerationAdapter.create_suspicion_level(True, 85.0) == "MEDIUM"
    assert WebhookModerationAdapter.create_suspicion_level(True, 65.0) == "LOW"
    assert WebhookModerationAdapter.create_suspicion_level(True, None) == "LOW"

    # 3. Test full adaptation pipeline
    raw_response = {
        "is_illegal": "True",
        "confidence": 0.85,
        "category": "violence",
        "subcategory": ["weapons", "hate speech"],
        "description": "  Test violence detected  "
    }

    adapted = WebhookModerationAdapter.adapt(raw_response)

    assert adapted["has_suspicious"] is True
    assert adapted["suspicion_level"] == "MEDIUM"  # 85% confidence (from 0.85 * 100)
    assert set(adapted["categories"]) == {"violence", "weapons", "hate speech"}
    assert adapted["confidence"] == 85.0
    assert adapted["explanation"] == "Test violence detected"

