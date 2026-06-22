from __future__ import annotations

import logging
from typing import Any

from app.clients.content.client import ContentServiceClient
from app.clients.moderation.client import ModerationServiceClient
from app.core.exceptions import BackendServiceError, BackendUnavailableError
from app.modules._base import forward_service_request, translate_gateway_error
from app.modules.comments.mappers.comment_mapper import (
    format_comment_detail,
    format_comment_search_item,
    get_owner_id,
    group_by_post,
)
from app.modules.comments.schemas import CommentsCursorResponse, CommentsListResponse

logger = logging.getLogger(__name__)


class CommentsGatewayService:
    def __init__(
        self,
        moderation_client: ModerationServiceClient | None = None,
        content_client: ContentServiceClient | None = None,
    ):
        self.moderation_client = moderation_client or ModerationServiceClient()
        self.content_client = content_client or ContentServiceClient()

    async def _moderation_request(
        self,
        method: str,
        path: str,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
        params: dict | None = None,
        json: Any | None = None,
    ) -> Any:
        try:
            return await forward_service_request(
                self.moderation_client,
                method,
                path,
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                params=params,
                json=json,
            )
        except (BackendServiceError, BackendUnavailableError) as exc:
            logger.warning(
                "Moderation request failed method=%s path=%s request_id=%s correlation_id=%s",
                method,
                path,
                request_id,
                correlation_id,
            )
            raise translate_gateway_error(exc) from exc

    async def _enrich_comments(
        self,
        items: list[dict[str, Any]],
        *,
        user_id: str | None = None,
    ) -> tuple[dict[int, dict], dict[int, dict]]:
        author_ids = list({i["author_vk_id"] for i in items if i.get("author_vk_id")})
        group_vk_ids = set()
        for item in items:
            owner_id = get_owner_id(item)
            if owner_id and owner_id < 0:
                group_vk_ids.add(abs(owner_id))

        author_profiles: dict[int, dict] = {}
        group_profiles: dict[int, dict] = {}

        if author_ids:
            try:
                profiles = await forward_service_request(
                    self.content_client,
                    "POST",
                    "/internal/content/authors/bulk",
                    user_id=user_id,
                    json=author_ids,
                )
                author_profiles = {p["vkAuthorId"]: p for p in (profiles or []) if p}
            except (BackendServiceError, BackendUnavailableError) as exc:
                logger.warning("Failed to fetch authors from content-service: %s", exc)

        if group_vk_ids:
            try:
                profiles = await forward_service_request(
                    self.content_client,
                    "POST",
                    "/internal/content/groups/bulk",
                    user_id=user_id,
                    json=list(group_vk_ids),
                )
                group_profiles = {p["vkGroupId"]: p for p in (profiles or []) if p} if profiles else {}
            except (BackendServiceError, BackendUnavailableError) as exc:
                logger.warning("Failed to fetch groups from content-service: %s", exc)

        return author_profiles, group_profiles

    async def _format_items(
        self,
        items: list[dict[str, Any]],
        *,
        user_id: str | None = None,
    ) -> list[dict[str, Any]]:
        author_profiles, group_profiles = await self._enrich_comments(items, user_id=user_id)
        result = []
        for item in items:
            owner_id = get_owner_id(item)
            group_profile = group_profiles.get(abs(owner_id)) if owner_id and owner_id < 0 else None
            result.append(format_comment_detail(item, author_profiles.get(item.get("author_vk_id")), group_profile))
        return result

    async def get_comments(
        self,
        *,
        page: int = 1,
        limit: int = 20,
        search: str | None = None,
        keywords: list[str] | None = None,
        keyword_source: str | None = None,
        read_status: str | None = None,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> CommentsListResponse:
        raw = await self._moderation_request(
            "GET",
            "/internal/moderation/comments",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            params={k: v for k, v in {
                "page": page,
                "limit": limit,
                "search": search,
                "keywords": keywords,
                "keywordSource": keyword_source,
                "readStatus": read_status,
            }.items() if v is not None},
        )
        return CommentsListResponse(
            items=await self._format_items(raw["items"], user_id=user_id),
            total=raw["total"],
            has_more=raw["has_more"],
            read_count=raw["read_count"],
            unread_count=raw["unread_count"],
        )

    async def get_comments_cursor(
        self,
        *,
        cursor: str | None = None,
        limit: int = 20,
        search: str | None = None,
        keywords: list[str] | None = None,
        keyword_source: str | None = None,
        read_status: str | None = None,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> CommentsCursorResponse:
        raw = await self._moderation_request(
            "GET",
            "/internal/moderation/comments/cursor",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            params={k: v for k, v in {
                "cursor": cursor,
                "limit": limit,
                "search": search,
                "keywords": keywords,
                "keywordSource": keyword_source,
                "readStatus": read_status,
            }.items() if v is not None},
        )
        return CommentsCursorResponse(
            items=await self._format_items(raw["items"], user_id=user_id),
            next_cursor=raw.get("next_cursor"),
            has_more=raw["has_more"],
            total=raw["total"],
            read_count=raw["read_count"],
            unread_count=raw["unread_count"],
        )

    async def patch_read_status(
        self,
        comment_id: int,
        *,
        is_read: bool,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        if not isinstance(is_read, bool):
            raise ValueError("is_read must be a boolean")

        return await self._moderation_request(
            "PATCH",
            f"/internal/moderation/comments/{comment_id}/read",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            json={"is_read": is_read},
        )

    async def patch_comment_status(
        self,
        comment_id: int,
        *,
        status: str,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        valid = {"Чисто", "Нарушение", "Новый", "Проверка"}
        if status not in valid:
            raise ValueError(f"Invalid status: {status}. Must be one of {valid}")

        return await self._moderation_request(
            "PATCH",
            f"/internal/moderation/comments/{comment_id}/status",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            json={"status": status},
        )

    async def search_comments(
        self,
        payload: dict[str, Any],
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        query = payload.get("query", "")
        view_mode = payload.get("viewMode", "comments")
        page = payload.get("page", 1)
        page_size = payload.get("pageSize", 20)
        keywords: list[str] = payload.get("keywords") or []
        read_status = payload.get("readStatus")

        params: dict[str, Any] = {"page": page, "limit": page_size}
        if query:
            params["search"] = query
        if keywords:
            params["keywords"] = keywords
        if read_status and read_status != "all":
            params["readStatus"] = read_status

        raw = await self._moderation_request(
            "GET",
            "/internal/moderation/comments",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            params=params,
        )
        raw_items = raw.get("items", [])
        total = raw.get("total", len(raw_items))

        if view_mode == "posts":
            items = group_by_post(raw_items, query)
        else:
            items = [format_comment_search_item(item, query) for item in raw_items]

        return {
            "source": "fallback",
            "viewMode": view_mode,
            "total": total,
            "page": page,
            "pageSize": page_size,
            "items": items,
        }


def get_comments_gateway_service() -> CommentsGatewayService:
    return CommentsGatewayService()
