from __future__ import annotations

from typing import Any

from app.clients.base import ServiceClient
from app.core.config import settings


class ModerationServiceClient(ServiceClient):
    def __init__(self) -> None:
        from httpx import Timeout

        super().__init__(
            service_name="Moderation",
            base_url=settings.moderation_base_url,
            internal_token=settings.internal_service_token,
            timeout=Timeout(timeout=10.0, connect=2.0, read=10.0, write=5.0),
        )

    async def get_comments(
        self,
        *,
        page: int = 1,
        limit: int = 20,
        search: str | None = None,
        keywords: str | None = None,
        read_status: str | None = None,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"page": page, "limit": limit}
        if search:
            params["search"] = search
        if keywords:
            params["keywords"] = keywords
        if read_status:
            params["readStatus"] = read_status
        return await self.request("GET", "/internal/moderation/comments", user_id=user_id, request_id=request_id, correlation_id=correlation_id, params=params)

    async def get_comments_cursor(
        self,
        *,
        cursor: str | None = None,
        limit: int = 20,
        search: str | None = None,
        keywords: str | None = None,
        read_status: str | None = None,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"limit": limit}
        if cursor:
            params["cursor"] = cursor
        if search:
            params["search"] = search
        if keywords:
            params["keywords"] = keywords
        if read_status:
            params["readStatus"] = read_status
        return await self.request("GET", "/internal/moderation/comments/cursor", user_id=user_id, request_id=request_id, correlation_id=correlation_id, params=params)

    async def patch_read_status(
        self,
        comment_id: int,
        *,
        is_read: bool,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        return await self.request("PATCH", f"/internal/moderation/comments/{comment_id}/read", user_id=user_id, request_id=request_id, correlation_id=correlation_id, json={"is_read": is_read})
