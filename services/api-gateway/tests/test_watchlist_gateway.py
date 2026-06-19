# ruff: noqa: E402
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.clients.base import ServiceClientHTTPError, ServiceClientUnavailableError
from app.modules.watchlist.service import WatchlistGatewayService


class RecordingModerationClient:
    base_url = "http://moderation"
    service_name = "Moderation"

    def __init__(self, response: dict):
        self.response = response
        self.calls: list[dict] = []

    async def request(self, method: str, path: str, **kwargs):
        self.calls.append({"method": method, "path": path, **kwargs})
        return self.response


class EmptyContentClient:
    base_url = "http://content"
    service_name = "Content"

    async def request(self, method: str, path: str, **kwargs):
        return []


class RecordingContentClient:
    base_url = "http://content"
    service_name = "Content"

    def __init__(self, profiles: list[dict] | None = None):
        self.profiles = profiles or []
        self.calls: list[dict] = []

    async def request(self, method: str, path: str, **kwargs):
        self.calls.append({"method": method, "path": path, **kwargs})
        return self.profiles


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

    frontend_payload = {
        "authorVkId": 123,
        "commentId": 456,
    }

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
        "files": None,
    }]
    assert result["authorVkId"] == 123
    assert result["author"] is None


@pytest.mark.asyncio
async def test_gateway_create_author_with_profile_enrichment():
    moderation_client = RecordingModerationClient(
        {
            "id": 1,
            "author_vk_id": 123,
            "status": "ACTIVE",
            "monitoring_started_at": "2026-05-24T12:00:00Z",
        }
    )
    content_client = RecordingContentClient([
        {
            "id": 1,
            "vkAuthorId": 123,
            "displayName": "Test User",
            "fullName": "Test User",
            "photo50": "https://example.com/photo.jpg",
            "screenName": "test_user",
        }
    ])
    service = WatchlistGatewayService(
        moderation_client=moderation_client,
        content_client=content_client,
    )

    result = await service.create_author(
        {"authorVkId": 123},
        user_id="user-1",
        request_id="req-1",
        correlation_id="corr-1",
    )

    assert result["authorVkId"] == 123
    assert result["author"] is not None
    assert result["author"]["vkAuthorId"] == 123
    assert result["author"]["displayName"] == "Test User"
    assert result["author"]["screenName"] == "test_user"


@pytest.mark.asyncio
async def test_gateway_get_authors_with_enrichment():
    moderation_response = {
        "items": [
            {
                "id": 1,
                "author_vk_id": 123,
                "status": "ACTIVE",
                "monitoring_started_at": "2026-05-24T12:00:00Z",
                "source_comment_id": None,
                "last_checked_at": None,
                "last_activity_at": None,
                "found_comments_count": 5,
                "monitoring_stopped_at": None,
                "settings_id": 1,
                "created_at": "2026-05-24T12:00:00Z",
                "updated_at": "2026-05-24T12:00:00Z",
            },
            {
                "id": 2,
                "author_vk_id": 456,
                "status": "PAUSED",
                "monitoring_started_at": "2026-05-24T12:00:00Z",
                "source_comment_id": None,
                "last_checked_at": None,
                "last_activity_at": None,
                "found_comments_count": 0,
                "monitoring_stopped_at": None,
                "settings_id": 1,
                "created_at": "2026-05-24T12:00:00Z",
                "updated_at": "2026-05-24T12:00:00Z",
            },
        ],
        "total": 2,
        "hasMore": False,
    }
    content_profiles = [
        {
            "id": 1,
            "vkAuthorId": 123,
            "displayName": "Alice",
            "fullName": "Alice",
            "photo50": None,
            "screenName": "alice_vk",
            "city": None,
            "isVerified": True,
            "profileUrl": "https://vk.com/id123",
            "followersCount": 100,
        },
    ]

    moderation_client = RecordingModerationClient(moderation_response)
    content_client = RecordingContentClient(content_profiles)

    service = WatchlistGatewayService(
        moderation_client=moderation_client,
        content_client=content_client,
    )

    result = await service.get_authors(
        offset=0, limit=20, exclude_stopped=False,
        user_id="user-1", request_id="req-1",
    )

    assert len(result["items"]) == 2
    assert result["total"] == 2
    assert result["hasMore"] is False

    # First item has author profile
    item1 = result["items"][0]
    assert item1["authorVkId"] == 123
    assert item1["author"] is not None
    assert item1["author"]["displayName"] == "Alice"
    assert item1["author"]["screenName"] == "alice_vk"
    assert item1["summary"] is not None

    # Second item has no profile (not in content-service)
    item2 = result["items"][1]
    assert item2["authorVkId"] == 456
    assert item2["author"] is None

    # Verify content service was called with correct vk IDs
    assert len(content_client.calls) == 1
    assert content_client.calls[0]["method"] == "POST"
    assert content_client.calls[0]["path"] == "/authors/bulk"
    assert content_client.calls[0]["json"] == [123, 456]


@pytest.mark.asyncio
async def test_gateway_get_author_details_with_enrichment():
    moderation_response = {
        "id": 1,
        "author_vk_id": 123,
        "status": "ACTIVE",
        "monitoring_started_at": "2026-05-24T12:00:00Z",
        "source_comment_id": None,
        "last_checked_at": None,
        "last_activity_at": None,
        "found_comments_count": 5,
        "monitoring_stopped_at": None,
        "settings_id": 1,
        "created_at": "2026-05-24T12:00:00Z",
        "updated_at": "2026-05-24T12:00:00Z",
        "comments": {
            "items": [],
            "total": 0,
            "hasMore": False,
        },
    }
    content_profiles = [
        {
            "id": 1,
            "vkAuthorId": 123,
            "displayName": "Alice",
            "fullName": "Alice",
            "photo50": None,
            "screenName": "alice_vk",
            "isVerified": True,
            "profileUrl": "https://vk.com/id123",
        },
    ]

    moderation_client = RecordingModerationClient(moderation_response)
    content_client = RecordingContentClient(content_profiles)

    service = WatchlistGatewayService(
        moderation_client=moderation_client,
        content_client=content_client,
    )

    result = await service.get_author_details(
        id=1, offset=0, limit=20,
        user_id="user-1", request_id="req-1",
    )

    assert result["authorVkId"] == 123
    assert result["author"] is not None
    assert result["author"]["displayName"] == "Alice"
    assert result["author"]["screenName"] == "alice_vk"
    assert result["comments"] is not None


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
        "files": None,
    }]
    assert result["trackAllComments"] is True
    assert result["pollIntervalMinutes"] == 10
    assert result["maxAuthors"] == 30


@pytest.mark.asyncio
async def test_gateway_create_author_preserves_conflict_status():
    class ConflictModerationClient:
        base_url = "http://moderation"
        service_name = "Moderation"

        async def request(self, method: str, path: str, **kwargs):
            raise ServiceClientHTTPError(service_name="Moderation", status_code=409, detail={"detail": "duplicate"})

    service = WatchlistGatewayService(
        moderation_client=ConflictModerationClient(),
        content_client=EmptyContentClient(),
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.create_author({"authorVkId": 123})

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "Moderation service error: duplicate"


@pytest.mark.asyncio
async def test_gateway_watchlist_maps_unavailable_upstream_to_502():
    class UnavailableModerationClient:
        base_url = "http://moderation"
        service_name = "Moderation"

        async def request(self, method: str, path: str, **kwargs):
            raise ServiceClientUnavailableError(service_name="Moderation")

    service = WatchlistGatewayService(
        moderation_client=UnavailableModerationClient(),
        content_client=EmptyContentClient(),
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.get_authors(offset=0, limit=20, exclude_stopped=True)

    assert exc_info.value.status_code == 502
    assert "service error" in exc_info.value.detail
