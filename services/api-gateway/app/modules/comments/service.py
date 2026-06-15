from typing import Any

from app.clients.content.client import ContentClient
from app.clients.moderation.client import ModerationClient

from .crud_service import CommentCrudService


class CommentsGatewayService:
    def __init__(
        self,
        moderation_client: ModerationClient | None = None,
        content_client: ContentClient | None = None,
    ):
        self.moderation_client = moderation_client or ModerationClient()
        self.content_client = content_client or ContentClient()
        svc = self
        self.crud = CommentCrudService(
            moderation_client=self.moderation_client,
            content_client=self.content_client,
            enrich=lambda items, **kw: svc.crud.enrich_comments(items, **kw),
        )

    async def get_comments(self, page: int, limit: int, **kw: Any) -> dict:
        params: dict = {"page": page, "limit": limit}
        for k, v in [("readStatus", kw.get("read_status")), ("search", kw.get("search"))]:
            if v:
                params[k] = v
        if kw.get("keywords"):
            params["keywords"] = kw["keywords"]

        raw = await self.crud.moderation_request(
            "GET", "/internal/moderation/comments",
            user_id=kw.get("user_id"), request_id=kw.get("request_id"),
            correlation_id=kw.get("correlation_id"), params=params,
        )
        items = await self.crud.enrich(
            raw["items"], user_id=kw.get("user_id"),
            request_id=kw.get("request_id"), correlation_id=kw.get("correlation_id"),
        )
        return {
            "items": items, "total": raw["total"], "hasMore": raw["has_more"],
            "readCount": raw["read_count"], "unreadCount": raw["unread_count"],
        }

    async def get_comments_cursor(self, cursor: str | None, limit: int, **kw: Any) -> dict:
        params: dict = {"limit": limit}
        if cursor:
            params["cursor"] = cursor
        for k, v in [("readStatus", kw.get("read_status")), ("search", kw.get("search"))]:
            if v:
                params[k] = v
        if kw.get("keywords"):
            params["keywords"] = kw["keywords"]

        raw = await self.crud.moderation_request(
            "GET", "/internal/moderation/comments/cursor",
            user_id=kw.get("user_id"), request_id=kw.get("request_id"),
            correlation_id=kw.get("correlation_id"), params=params,
        )
        items = await self.crud.enrich(
            raw["items"], user_id=kw.get("user_id"),
            request_id=kw.get("request_id"), correlation_id=kw.get("correlation_id"),
        )
        return {
            "items": items, "nextCursor": raw["next_cursor"],
            "hasMore": raw["has_more"], "total": raw["total"],
            "readCount": raw["read_count"], "unreadCount": raw["unread_count"],
        }

    async def patch_read_status(self, id: int, payload: dict, **kw: Any) -> dict:
        is_read = payload.get("isRead") if payload.get("isRead") is not None else payload.get("is_read")
        if is_read is None:
            from fastapi import HTTPException
            raise HTTPException(status_code=422, detail="isRead field is required")
        if not isinstance(is_read, bool):
            from fastapi import HTTPException
            raise HTTPException(status_code=422, detail="isRead field must be a boolean")

        item = await self.crud.moderation_request(
            "PATCH", f"/internal/moderation/comments/{id}/read",
            user_id=kw.get("user_id"), request_id=kw.get("request_id"),
            correlation_id=kw.get("correlation_id"),
            params=None, json={"is_read": is_read},
        )
        enriched = await self.crud.enrich(
            [item], user_id=kw.get("user_id"),
            request_id=kw.get("request_id"), correlation_id=kw.get("correlation_id"),
        )
        return enriched[0] if enriched else item

    async def search_comments(self, payload: dict, **kw: Any) -> dict:
        query = payload.get("query", "")
        view_mode = payload.get("viewMode", "comments")
        page = payload.get("page", 1)
        page_size = payload.get("pageSize", 20)
        keywords: list[str] = payload.get("keywords") or []
        read_status = payload.get("readStatus")

        params: dict = {"page": page, "limit": page_size}
        if query:
            params["search"] = query
        if keywords:
            params["keywords"] = keywords
        if read_status and read_status != "all":
            params["readStatus"] = read_status

        raw = await self.crud.moderation_request(
            "GET", "/internal/moderation/comments",
            user_id=kw.get("user_id"), request_id=kw.get("request_id"),
            correlation_id=kw.get("correlation_id"), params=params,
        )
        raw_items = raw.get("items", [])
        total = raw.get("total", len(raw_items))

        if view_mode == "posts":
            items = self.crud.group_by_post(raw_items, query)
        else:
            items = [self.crud.format_comment_search_item(item, query) for item in raw_items]

        return {
            "source": "fallback", "viewMode": view_mode, "total": total,
            "page": page, "pageSize": page_size, "items": items,
        }


def get_comments_gateway_service() -> CommentsGatewayService:
    return CommentsGatewayService()
