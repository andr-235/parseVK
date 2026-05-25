import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path
use_service_path()

from app.modules.watchlist.service import WatchlistGatewayService


@pytest.mark.asyncio
@patch("httpx.AsyncClient.post")
async def test_gateway_create_author_payload_translation(mock_post):
    service = WatchlistGatewayService()

    # Mock response from moderation-service
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "id": 1,
        "author_vk_id": 123,
        "status": "ACTIVE",
        "monitoring_started_at": "2026-05-24T12:00:00Z",
    }
    mock_post.return_value = mock_resp

    # Input payload from frontend (camelCase)
    frontend_payload = {
        "authorVkId": 123,
        "commentId": 456,
    }

    # We also mock _enrich_authors since we only want to test payload mapping
    with patch.object(service, "_enrich_authors", new_callable=AsyncMock) as mock_enrich:
        mock_enrich.return_value = [{
            "id": 1,
            "authorVkId": 123,
            "status": "ACTIVE",
            "monitoringStartedAt": "2026-05-24T12:00:00Z",
            "author": None,
            "summary": None,
        }]

        result = await service.create_author(frontend_payload)

    # Check that HTTP POST request was made with snake_case payload
    mock_post.assert_called_once()
    args, kwargs = mock_post.call_args
    assert args[0] == f"{service.moderation_url}/internal/watchlist/authors"
    assert kwargs["json"] == {
        "author_vk_id": 123,
        "comment_id": 456,
    }
    assert result["authorVkId"] == 123


@pytest.mark.asyncio
@patch("httpx.AsyncClient.patch")
async def test_gateway_update_settings_payload_translation(mock_patch):
    service = WatchlistGatewayService()

    # Mock response from moderation-service
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "id": 1,
        "track_all_comments": True,
        "poll_interval_minutes": 10,
        "max_authors": 30,
    }
    mock_patch.return_value = mock_resp

    frontend_payload = {
        "trackAllComments": True,
        "pollIntervalMinutes": 10,
        "maxAuthors": 30,
    }

    result = await service.update_settings(frontend_payload)

    # Check that HTTP PATCH request was made with snake_case payload
    mock_patch.assert_called_once()
    args, kwargs = mock_patch.call_args
    assert args[0] == f"{service.moderation_url}/internal/watchlist/settings"
    assert kwargs["json"] == {
        "track_all_comments": True,
        "poll_interval_minutes": 10,
        "max_authors": 30,
    }
    assert result["trackAllComments"] is True
    assert result["pollIntervalMinutes"] == 10
    assert result["maxAuthors"] == 30
