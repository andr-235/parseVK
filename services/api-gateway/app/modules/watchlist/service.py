from typing import Any

from app.clients.content.client import ContentClient
from app.clients.moderation.client import ModerationClient

from .crud_service import WatchlistCrudService


class WatchlistGatewayService:
    def __init__(
        self,
        moderation_client: ModerationClient | None = None,
        content_client: ContentClient | None = None,
    ):
        self.moderation_client = moderation_client or ModerationClient()
        self.content_client = content_client or ContentClient()
        self.moderation_url = self.moderation_client.base_url
        self.content_url = self.content_client.base_url
        svc = self
        self.crud = WatchlistCrudService(
            moderation_client=self.moderation_client,
            content_client=self.content_client,
            on_enrich=lambda records, **kw: svc._enrich_authors(records, **kw),
        )

    async def _moderation_request(self, method: str, path: str, **kw: Any) -> dict:
        return await self.crud.moderation_request(method, path, **kw)

    async def _enrich_authors(self, records: list[dict], **kw: Any) -> list[dict]:
        return await self.crud._default_enrich(records, **kw)

    async def get_authors(self, offset: int, limit: int, exclude_stopped: bool, **kw: Any) -> dict:
        params = {"offset": offset, "limit": limit, "excludeStopped": exclude_stopped}
        data = await self._moderation_request("GET", "/internal/watchlist/authors", params=params, **kw)
        items = await self._enrich_authors(data["items"], **kw)
        return {"items": items, "total": data["total"], "hasMore": data["hasMore"]}

    async def get_author_details(self, id: int, offset: int, limit: int, **kw: Any) -> dict:
        params = {"offset": offset, "limit": limit}
        data = await self._moderation_request(
            "GET", f"/internal/watchlist/authors/{id}", params=params, **kw,
            status_details={404: "Watchlist author not found"},
        )
        enriched_list = await self._enrich_authors([data], **kw)
        enriched_author = enriched_list[0] if enriched_list else data
        return {**enriched_author, "comments": data["comments"]}

    async def create_author(self, payload: dict, **kw: Any) -> dict:
        backend_payload = {}
        if "authorVkId" in payload:
            backend_payload["author_vk_id"] = payload["authorVkId"]
        if "commentId" in payload:
            backend_payload["comment_id"] = payload["commentId"]
        data = await self._moderation_request(
            "POST", "/internal/watchlist/authors", json=backend_payload, **kw,
            status_details={404: "Source comment not found", 409: "Author already in watchlist"},
        )
        enriched = await self._enrich_authors([data], **kw)
        return enriched[0] if enriched else data

    async def update_author(self, id: int, payload: dict, **kw: Any) -> dict:
        data = await self._moderation_request(
            "PATCH", f"/internal/watchlist/authors/{id}", json=payload, **kw,
            status_details={404: "Watchlist author not found"},
        )
        enriched = await self._enrich_authors([data], **kw)
        return enriched[0] if enriched else data

    async def delete_author(self, id: int, **kw: Any) -> None:
        await self._moderation_request(
            "DELETE", f"/internal/watchlist/authors/{id}", **kw,
            status_details={404: "Watchlist author not found"},
        )

    async def get_settings(self, **kw: Any) -> dict:
        data = await self._moderation_request("GET", "/internal/watchlist/settings", **kw)
        return {
            "id": data["id"],
            "trackAllComments": data["track_all_comments"],
            "pollIntervalMinutes": data["poll_interval_minutes"],
            "maxAuthors": data["max_authors"],
        }

    async def update_settings(self, payload: dict, **kw: Any) -> dict:
        backend_payload = {}
        if "trackAllComments" in payload:
            backend_payload["track_all_comments"] = payload["trackAllComments"]
        if "pollIntervalMinutes" in payload:
            backend_payload["poll_interval_minutes"] = payload["pollIntervalMinutes"]
        if "maxAuthors" in payload:
            backend_payload["max_authors"] = payload["maxAuthors"]
        data = await self._moderation_request("PATCH", "/internal/watchlist/settings", json=backend_payload, **kw)
        return {
            "id": data["id"],
            "trackAllComments": data["track_all_comments"],
            "pollIntervalMinutes": data["poll_interval_minutes"],
            "maxAuthors": data["max_authors"],
        }

    async def manual_refresh(self, **kw: Any) -> dict:
        return await self._moderation_request("POST", "/internal/watchlist/refresh", **kw)


def get_watchlist_gateway_service() -> WatchlistGatewayService:
    return WatchlistGatewayService()
