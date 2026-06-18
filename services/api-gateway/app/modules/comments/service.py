import re
from typing import Any

from app.clients.base import ServiceClient, ServiceClientHTTPError, ServiceClientUnavailableError
from app.core.config import settings
from fastapi import HTTPException, status

_VK_POST_EXTERNAL_RE = re.compile(r"^vk_(-?\d+)_(\d+)$")


def _parse_owner_id(post_external_key: str | None) -> int | None:
    if not post_external_key:
        return None
    m = _VK_POST_EXTERNAL_RE.match(post_external_key)
    return int(m.group(1)) if m else None


def _format_comment(item: dict) -> dict:
    owner_id = item.get("ownerId") or _parse_owner_id(item.get("post_external_key"))
    date = item.get("date") or item.get("created_at")
    date_str = date.isoformat() if hasattr(date, "isoformat") else str(date or "")
    return {
        "id": item["id"],
        "text": item.get("text", ""),
        "ownerId": owner_id,
        "createdAt": date_str,
        "author": {
            "displayName": None,
            "fullName": None,
            "profileUrl": f"https://vk.com/id{item['author_vk_id']}" if item.get("author_vk_id") else None,
            "screenName": None,
        },
        "group": None,
        "isRead": item.get("is_read", False),
    }


class CommentsGatewayService:
    def __init__(self, moderation_client: ServiceClient | None = None, content_client: ServiceClient | None = None):
        self.moderation_client = moderation_client or ServiceClient(service_name="Moderation", base_url=settings.moderation_base_url, internal_token=settings.internal_service_token)
        self.content_client = content_client or ServiceClient(service_name="Content", base_url=settings.content_base_url, internal_token=settings.internal_service_token)

    async def _moderation_request(self, method: str, path: str, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None, params: dict | None = None, json: Any | None = None) -> dict:
        try:
            return await self.moderation_client.request(method, path, user_id=user_id or "", request_id=request_id, correlation_id=correlation_id, params=params, json=json)
        except ServiceClientHTTPError as exc:
            detail = exc.detail.get("detail", exc.detail) if isinstance(exc.detail, dict) else exc.detail
            raise HTTPException(status_code=exc.status_code, detail=detail) from exc
        except ServiceClientUnavailableError:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Moderation service unavailable") from None

    async def get_comments(self, page: int, limit: int, **kw: Any) -> dict:
        params: dict = {"page": page, "limit": limit}
        for k, v in [("readStatus", kw.get("read_status")), ("search", kw.get("search"))]:
            if v:
                params[k] = v
        if kw.get("keywords"):
            params["keywords"] = kw["keywords"]

        raw = await self._moderation_request("GET", "/internal/moderation/comments", user_id=kw.get("user_id"), request_id=kw.get("request_id"), correlation_id=kw.get("correlation_id"), params=params)
        return {
            "items": [_format_comment(i) for i in raw["items"]],
            "total": raw["total"],
            "hasMore": raw["has_more"],
            "readCount": raw["read_count"],
            "unreadCount": raw["unread_count"],
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

        raw = await self._moderation_request("GET", "/internal/moderation/comments/cursor", user_id=kw.get("user_id"), request_id=kw.get("request_id"), correlation_id=kw.get("correlation_id"), params=params)
        return {"items": [_format_comment(i) for i in raw["items"]], "nextCursor": raw["next_cursor"], "hasMore": raw["has_more"], "total": raw["total"], "readCount": raw["read_count"], "unreadCount": raw["unread_count"]}

    async def patch_read_status(self, id: int, payload: dict, **kw: Any) -> dict:
        is_read = payload.get("isRead") if payload.get("isRead") is not None else payload.get("is_read")
        if is_read is None:
            from fastapi import HTTPException
            raise HTTPException(status_code=422, detail="isRead field is required")
        if not isinstance(is_read, bool):
            from fastapi import HTTPException
            raise HTTPException(status_code=422, detail="isRead field must be a boolean")

        return await self._moderation_request("PATCH", f"/internal/moderation/comments/{id}/read", user_id=kw.get("user_id"), request_id=kw.get("request_id"), correlation_id=kw.get("correlation_id"), params=None, json={"is_read": is_read})

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

        raw = await self._moderation_request("GET", "/internal/moderation/comments", user_id=kw.get("user_id"), request_id=kw.get("request_id"), correlation_id=kw.get("correlation_id"), params=params)
        raw_items = raw.get("items", [])
        total = raw.get("total", len(raw_items))

        if view_mode == "posts":
            items = self._group_by_post(raw_items, query)
        else:
            items = [self._format_comment_search_item(item, query) for item in raw_items]

        return {"source": "fallback", "viewMode": view_mode, "total": total, "page": page, "pageSize": page_size, "items": items}

    def _group_by_post(self, raw_items: list[dict], query: str | None = None) -> list[dict]:
        grouped: dict[str, dict] = {}
        for item in raw_items:
            post_id = item.get("post_id") or item.get("postId") or "unknown"
            if post_id not in grouped:
                grouped[post_id] = {"postId": post_id, "postText": item.get("post_text") or item.get("postText", ""), "comments": []}
            grouped[post_id]["comments"].append(_format_comment_for_group(item))
        return list(grouped.values())

    def _format_comment_search_item(self, item: dict, query: str | None = None) -> dict:
        return {
            "id": item.get("id"), "text": item.get("text", ""),
            "authorVkId": item.get("author_vk_id") or item.get("authorVkId"),
            "authorName": item.get("author_name") or item.get("authorName", "Unknown"),
            "postId": item.get("post_id") or item.get("postId"),
            "postText": item.get("post_text") or item.get("postText", ""),
            "date": item.get("date") or item.get("created_at"),
            "readStatus": item.get("read_status") if item.get("read_status") is not None else item.get("readStatus"),
        }


def _format_comment_for_group(item: dict) -> dict:
    return {
        "id": item.get("id"), "text": item.get("text", ""),
        "authorVkId": item.get("author_vk_id") or item.get("authorVkId"),
        "authorName": item.get("author_name") or item.get("authorName", "Unknown"),
        "date": item.get("date") or item.get("created_at"),
        "readStatus": item.get("read_status") if item.get("read_status") is not None else item.get("readStatus"),
    }


def get_comments_gateway_service() -> CommentsGatewayService:
    return CommentsGatewayService()
