from __future__ import annotations

import logging
from typing import Any

from app.clients.content.client import ContentServiceClient
from app.clients.moderation.client import ModerationServiceClient
from app.core.exceptions import BackendServiceError, BackendUnavailableError
from app.modules._base import forward_service_request, translate_gateway_error

logger = logging.getLogger(__name__)


def _map_watchlist_item(item: dict[str, Any], profile: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "id": item["id"],
        "authorVkId": item["author_vk_id"],
        "status": item["status"],
        "lastCheckedAt": item.get("last_checked_at"),
        "lastActivityAt": item.get("last_activity_at"),
        "foundCommentsCount": item.get("found_comments_count", 0),
        "monitoringStartedAt": item["monitoring_started_at"],
        "monitoringStoppedAt": item.get("monitoring_stopped_at"),
        "author": profile,
        "summary": {
            "total": 0,
            "suspicious": 0,
            "lastAnalyzedAt": None,
            "categories": [],
            "levels": [],
        },
    }


class WatchlistGatewayService:
    def __init__(self, moderation_client: ModerationServiceClient | None = None, content_client: ContentServiceClient | None = None):
        self.moderation_client = moderation_client or ModerationServiceClient()
        self.content_client = content_client or ContentServiceClient()

    async def _moderation_request(self, method: str, path: str, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None, params: dict | None = None, json: Any | None = None) -> dict:
        try:
            return await forward_service_request(
                self.moderation_client,
                method, path,
                user_id=user_id, request_id=request_id, correlation_id=correlation_id,
                params=params, json=json,
            )
        except (BackendServiceError, BackendUnavailableError) as exc:
            raise translate_gateway_error(exc) from exc

    async def _fetch_profiles(self, vk_author_ids: list[int], user_id: str | None = None) -> dict[int, dict]:
        if not vk_author_ids:
            return {}
        try:
            profiles = await forward_service_request(
                self.content_client,
                "POST", "/authors/bulk",
                user_id=user_id, json=vk_author_ids,
            )
        except (BackendServiceError, BackendUnavailableError) as exc:
            logger.warning("Failed to fetch author profiles from content service: %s", exc)
            return {}
        return {p["vkAuthorId"]: p for p in (profiles or []) if p}

    async def get_authors(self, offset: int, limit: int, exclude_stopped: bool, **kw: Any) -> dict:
        params = {"offset": offset, "limit": limit, "excludeStopped": exclude_stopped}
        data = await self._moderation_request("GET", "/internal/watchlist/authors", params=params, **kw)
        items = data.get("items", [])
        vk_ids = [i["author_vk_id"] for i in items if i.get("author_vk_id")]
        user_id = kw.get("user_id")
        profiles = await self._fetch_profiles(vk_ids, user_id=user_id)
        return {
            "items": [_map_watchlist_item(i, profiles.get(i.get("author_vk_id"))) for i in items],
            "total": data["total"],
            "hasMore": data["hasMore"],
        }

    async def get_author_details(self, id: int, offset: int, limit: int, **kw: Any) -> dict:
        params = {"offset": offset, "limit": limit}
        data = await self._moderation_request("GET", f"/internal/watchlist/authors/{id}", params=params, **kw)
        item = {k: v for k, v in data.items() if k != "comments"}
        vk_ids = [item["author_vk_id"]] if item.get("author_vk_id") else []
        user_id = kw.get("user_id")
        profiles = await self._fetch_profiles(vk_ids, user_id=user_id)
        return {
            **_map_watchlist_item(item, profiles.get(item.get("author_vk_id"))),
            "comments": data["comments"],
        }

    async def create_author(self, payload: dict, **kw: Any) -> dict:
        backend_payload = {}
        if "authorVkId" in payload:
            backend_payload["author_vk_id"] = payload["authorVkId"]
        if "commentId" in payload:
            backend_payload["comment_id"] = payload["commentId"]
        item = await self._moderation_request("POST", "/internal/watchlist/authors", json=backend_payload, **kw)
        profile = None
        if item.get("author_vk_id"):
            user_id = kw.get("user_id", "")
            profiles = await self._fetch_profiles([item["author_vk_id"]], user_id=user_id)
            profile = profiles.get(item["author_vk_id"])
        return _map_watchlist_item(item, profile)

    async def update_author(self, id: int, payload: dict, **kw: Any) -> dict:
        return await self._moderation_request("PATCH", f"/internal/watchlist/authors/{id}", json=payload, **kw)

    async def delete_author(self, id: int, **kw: Any) -> None:
        await self._moderation_request("DELETE", f"/internal/watchlist/authors/{id}", **kw)

    async def get_settings(self, **kw: Any) -> dict:
        data = await self._moderation_request("GET", "/internal/watchlist/settings", **kw)
        return {"id": data["id"], "trackAllComments": data["track_all_comments"], "pollIntervalMinutes": data["poll_interval_minutes"], "maxAuthors": data["max_authors"]}

    async def update_settings(self, payload: dict, **kw: Any) -> dict:
        backend_payload = {}
        if "trackAllComments" in payload:
            backend_payload["track_all_comments"] = payload["trackAllComments"]
        if "pollIntervalMinutes" in payload:
            backend_payload["poll_interval_minutes"] = payload["pollIntervalMinutes"]
        if "maxAuthors" in payload:
            backend_payload["max_authors"] = payload["maxAuthors"]
        data = await self._moderation_request("PATCH", "/internal/watchlist/settings", json=backend_payload, **kw)
        return {"id": data["id"], "trackAllComments": data["track_all_comments"], "pollIntervalMinutes": data["poll_interval_minutes"], "maxAuthors": data["max_authors"]}

    async def manual_refresh(self, **kw: Any) -> dict:
        return await self._moderation_request("POST", "/internal/watchlist/refresh", **kw)


def get_watchlist_gateway_service() -> WatchlistGatewayService:
    return WatchlistGatewayService()
