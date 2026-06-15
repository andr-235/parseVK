# ruff: noqa: E402
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.clients.moderation.client import (
    ModerationClientHTTPError,
    ModerationClientUnavailableError,
)
from app.modules.watchlist.service import WatchlistGatewayService


class RecordingModerationClient:
    base_url = "http://moderation"

    def __init__(self, response: dict):
        self.response = response
        self.calls: list[dict] = []

    async def request(self, method: str, path: str, **kwargs):
        self.calls.append({"method": method, "path": path, **kwargs})
        return self.response


class EmptyContentClient:
    base_url = "http://content"

    async def request(self, method: str, path: str, **kwargs):
        return []


@pytest.mark.asyncio
async def test_gateway_create_author_payload_translation():
    moderation_client = RecordingModerationClient(
        {
        "id": 1,
        "author_vk_id": 123,
        "status": "ACTIVE",
        "monitoring_started_at": "2026-05-24T12:00:00Z",
        }
    )
    service = WatchlistGatewayService(
        moderation_client=moderation_client,
        content_client=EmptyContentClient(),
    )

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

        result = await service.create_author(
            frontend_payload,
            user_id="user-1",
            request_id="req-1",
            correlation_id="corr-1",
        )

    assert moderation_client.calls == [{
        "method": "POST",
        "path": "/internal/watchlist/authors",
        "user_id": "user-1",
        "request_id": "req-1",
        "correlation_id": "corr-1",
        "params": None,
        "json": {
        "author_vk_id": 123,
        "comment_id": 456,
        },
    }]
    assert result["authorVkId"] == 123


@pytest.mark.asyncio
async def test_gateway_update_settings_payload_translation():
    moderation_client = RecordingModerationClient(
        {
        "id": 1,
        "track_all_comments": True,
        "poll_interval_minutes": 10,
        "max_authors": 30,
        }
    )
    service = WatchlistGatewayService(
        moderation_client=moderation_client,
        content_client=EmptyContentClient(),
    )

    frontend_payload = {
        "trackAllComments": True,
        "pollIntervalMinutes": 10,
        "maxAuthors": 30,
    }

    result = await service.update_settings(
        frontend_payload,
        user_id="user-1",
        request_id="req-1",
        correlation_id="corr-1",
    )

    assert moderation_client.calls == [{
        "method": "PATCH",
        "path": "/internal/watchlist/settings",
        "user_id": "user-1",
        "request_id": "req-1",
        "correlation_id": "corr-1",
        "params": None,
        "json": {
        "track_all_comments": True,
        "poll_interval_minutes": 10,
        "max_authors": 30,
        },
    }]
    assert result["trackAllComments"] is True
    assert result["pollIntervalMinutes"] == 10
    assert result["maxAuthors"] == 30


@pytest.mark.asyncio
async def test_gateway_create_author_preserves_conflict_status():
    class ConflictModerationClient:
        base_url = "http://moderation"

        async def request(self, method: str, path: str, **kwargs):
            raise ModerationClientHTTPError(status_code=409, detail={"detail": "duplicate"})

    service = WatchlistGatewayService(
        moderation_client=ConflictModerationClient(),
        content_client=EmptyContentClient(),
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.create_author({"authorVkId": 123})

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "Author already in watchlist"


@pytest.mark.asyncio
async def test_gateway_watchlist_maps_unavailable_upstream_to_503():
    class UnavailableModerationClient:
        base_url = "http://moderation"

        async def request(self, method: str, path: str, **kwargs):
            raise ModerationClientUnavailableError("Moderation service is unavailable")

    service = WatchlistGatewayService(
        moderation_client=UnavailableModerationClient(),
        content_client=EmptyContentClient(),
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.get_authors(offset=0, limit=20, exclude_stopped=True)

    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "Moderation service unavailable"
