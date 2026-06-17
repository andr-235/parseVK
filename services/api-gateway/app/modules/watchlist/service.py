from typing import Any

from app.clients.base import ServiceClient, ServiceClientHTTPError, ServiceClientUnavailableError
from app.core.config import settings
from fastapi import HTTPException, status


class WatchlistGatewayService:
    def __init__(self, moderation_client: ServiceClient | None = None, content_client: ServiceClient | None = None):
        self.moderation_client = moderation_client or ServiceClient(service_name="Moderation", base_url=settings.moderation_base_url, internal_token=settings.internal_service_token)
        self.content_client = content_client or ServiceClient(service_name="Content", base_url=settings.content_base_url, internal_token=settings.internal_service_token)
        self.moderation_url = self.moderation_client.base_url
        self.content_url = self.content_client.base_url

    async def _moderation_request(self, method: str, path: str, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None, params: dict | None = None, json: Any | None = None) -> dict:
        try:
            return await self.moderation_client.request(method, path, user_id=user_id or "", request_id=request_id, correlation_id=correlation_id, params=params, json=json)
        except ServiceClientHTTPError as exc:
            detail = exc.detail.get("detail", exc.detail) if isinstance(exc.detail, dict) else exc.detail
            raise HTTPException(status_code=exc.status_code, detail=detail) from exc
        except ServiceClientUnavailableError:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Moderation service unavailable") from None

    async def get_authors(self, offset: int, limit: int, exclude_stopped: bool, **kw: Any) -> dict:
        params = {"offset": offset, "limit": limit, "excludeStopped": exclude_stopped}
        data = await self._moderation_request("GET", "/internal/watchlist/authors", params=params, **kw)
        return {"items": data["items"], "total": data["total"], "hasMore": data["hasMore"]}

    async def get_author_details(self, id: int, offset: int, limit: int, **kw: Any) -> dict:
        params = {"offset": offset, "limit": limit}
        data = await self._moderation_request("GET", f"/internal/watchlist/authors/{id}", params=params, **kw)
        return {**data, "comments": data["comments"]}

    async def create_author(self, payload: dict, **kw: Any) -> dict:
        backend_payload = {}
        if "authorVkId" in payload:
            backend_payload["author_vk_id"] = payload["authorVkId"]
        if "commentId" in payload:
            backend_payload["comment_id"] = payload["commentId"]
        return await self._moderation_request("POST", "/internal/watchlist/authors", json=backend_payload, **kw)

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
