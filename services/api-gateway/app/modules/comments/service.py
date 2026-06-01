from typing import Any

from app.clients.content.client import (
    ContentClient,
    ContentClientHTTPError,
    ContentClientUnavailableError,
)
from app.clients.moderation.client import (
    ModerationClient,
    ModerationClientHTTPError,
    ModerationClientUnavailableError,
)
from fastapi import HTTPException, status


class CommentsGatewayService:
    def __init__(
        self,
        moderation_client: ModerationClient | None = None,
        content_client: ContentClient | None = None,
    ):
        self.moderation_client = moderation_client or ModerationClient()
        self.content_client = content_client or ContentClient()

    # ------------------------------------------------------------------ #
    #  Public methods                                                      #
    # ------------------------------------------------------------------ #

    async def get_comments(
        self,
        page: int,
        limit: int,
        keywords: list[str] | None = None,
        keyword_source: str | None = None,
        read_status: str | None = None,
        search: str | None = None,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        params: dict = {"page": page, "limit": limit}
        if read_status:
            params["readStatus"] = read_status
        if search:
            params["search"] = search
        # keywordSource is a documented no-op until storage model contains source data
        # TODO: enable keywordSource filtering once matched_keywords stores source info
        if keywords:
            # httpx accepts list values for multi-value params
            params["keywords"] = keywords

        raw = await self._moderation_request(
            "GET",
            "/internal/moderation/comments",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            params=params,
        )

        items = await self._enrich_comments(
            raw["items"],
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return {
            "items": items,
            "total": raw["total"],
            "hasMore": raw["has_more"],
            "readCount": raw["read_count"],
            "unreadCount": raw["unread_count"],
        }

    async def get_comments_cursor(
        self,
        cursor: str | None,
        limit: int,
        keywords: list[str] | None = None,
        keyword_source: str | None = None,
        read_status: str | None = None,
        search: str | None = None,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        params: dict = {"limit": limit}
        if cursor:
            params["cursor"] = cursor
        if read_status:
            params["readStatus"] = read_status
        if search:
            params["search"] = search
        # TODO: enable keywordSource filtering once matched_keywords stores source info
        if keywords:
            params["keywords"] = keywords

        raw = await self._moderation_request(
            "GET",
            "/internal/moderation/comments/cursor",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            params=params,
        )

        items = await self._enrich_comments(
            raw["items"],
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return {
            "items": items,
            "nextCursor": raw["next_cursor"],
            "hasMore": raw["has_more"],
            "total": raw["total"],
            "readCount": raw["read_count"],
            "unreadCount": raw["unread_count"],
        }

    async def patch_read_status(
        self,
        id: int,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        # Adapt camelCase frontend payload to snake_case internal payload
        is_read = payload.get("isRead")
        if is_read is None:
            is_read = payload.get("is_read")
        if is_read is None:
            raise HTTPException(status_code=422, detail="isRead field is required")
        if not isinstance(is_read, bool):
            raise HTTPException(status_code=422, detail="isRead field must be a boolean")

        item = await self._moderation_request(
            "PATCH",
            f"/internal/moderation/comments/{id}/read",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            json={"is_read": is_read},
        )

        enriched = await self._enrich_comments(
            [item],
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return enriched[0] if enriched else item

    async def search_comments(
        self,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        """Fallback search via moderation-service.

        Maps frontend CommentsSearchRequestDto to moderation-service query params.
        Returns CommentsSearchResponseDto with source='fallback'.
        """
        query = payload.get("query", "")
        view_mode = payload.get("viewMode", "comments")
        page = payload.get("page", 1)
        page_size = payload.get("pageSize", 20)
        keywords: list[str] = payload.get("keywords") or []
        # keywordSource is a no-op at this layer (no source data in moderation storage)
        # TODO: enable once matched_keywords stores source info
        read_status = payload.get("readStatus")

        params: dict = {"page": page, "limit": page_size}
        # Frontend 'query' maps to moderation-service 'search' parameter
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
            items = self._group_by_post(raw_items, query)
        else:
            items = [self._format_comment_search_item(item, query) for item in raw_items]

        return {
            "source": "fallback",
            "viewMode": view_mode,
            "total": total,
            "page": page,
            "pageSize": page_size,
            "items": items,
        }

    # ------------------------------------------------------------------ #
    #  Private helpers                                                     #
    # ------------------------------------------------------------------ #

    def _format_comment_search_item(self, item: dict, query: str) -> dict:
        highlight: list[str] = []
        if query and item.get("text") and query.lower() in item["text"].lower():
            highlight = [query]
        parts = (item.get("external_key") or "").split(":")
        post_id = int(parts[1]) if len(parts) > 1 else None
        return {
            "type": "comment",
            "commentId": item.get("id"),
            "postId": post_id,
            "commentText": item.get("text") or "",
            "postText": None,
            "highlight": highlight,
        }

    def _group_by_post(self, raw_items: list[dict], query: str) -> list[dict]:
        """Group comment items by post_external_key for viewMode=posts."""
        posts: dict[str, dict] = {}
        order: list[str] = []

        for item in raw_items:
            post_key = item.get("post_external_key") or ""
            parts = (item.get("external_key") or "").split(":")
            post_id = int(parts[1]) if len(parts) > 1 else None

            if post_key not in posts:
                posts[post_key] = {
                    "type": "post",
                    "postId": post_id,
                    "postText": None,
                    "comments": [],
                }
                order.append(post_key)

            posts[post_key]["comments"].append(self._format_comment_search_item(item, query))

        return [posts[k] for k in order]

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
    ) -> dict:
        try:
            return await self.moderation_client.request(
                method,
                path,
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                params=params,
                json=json,
            )
        except ModerationClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except ModerationClientUnavailableError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Moderation service unavailable",
            ) from exc

    async def _content_request(
        self,
        method: str,
        path: str,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
        json: Any | None = None,
    ) -> Any:
        try:
            return await self.content_client.request(
                method,
                path,
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                json=json,
            )
        except ContentClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except ContentClientUnavailableError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Content service unavailable",
            ) from exc

    async def _enrich_comments(
        self,
        items: list[dict],
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> list[dict]:
        if not items:
            return items

        author_vk_ids = list({item["author_vk_id"] for item in items if item.get("author_vk_id")})
        post_external_keys = list(
            {item["post_external_key"] for item in items if item.get("post_external_key")}
        )

        group_vk_ids: set[int] = set()
        for item in items:
            parts = (item.get("external_key") or "").split(":")
            if len(parts) > 0 and parts[0]:
                try:
                    owner_id = int(parts[0])
                    if owner_id < 0:
                        group_vk_ids.add(abs(owner_id))
                except ValueError:
                    pass

        authors_dict: dict = {}
        posts_dict: dict = {}
        groups_dict: dict = {}

        if author_vk_ids:
            authors = await self._content_request(
                "POST",
                "/internal/content/authors/bulk",
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                json=author_vk_ids,
            )
            authors_dict = {a["vkAuthorId"]: a for a in authors}

        if post_external_keys:
            posts = await self._content_request(
                "POST",
                "/internal/content/posts/bulk",
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                json=post_external_keys,
            )
            posts_dict = {p["externalKey"]: p for p in posts}

            if group_vk_ids:
                groups = await self._content_request(
                    "POST",
                    "/internal/content/groups/bulk",
                    user_id=user_id,
                    request_id=request_id,
                    correlation_id=correlation_id,
                    json=list(group_vk_ids),
                )
                groups_dict = {g["vkGroupId"]: g for g in groups}

        enriched_items = []
        for item in items:
            author_vk_id = item.get("author_vk_id")
            post_key = item.get("post_external_key")

            author = authors_dict.get(author_vk_id) if author_vk_id else None
            post = posts_dict.get(post_key) if post_key else None

            parts = (item.get("external_key") or "").split(":")
            owner_id = int(parts[0]) if len(parts) > 0 and parts[0] else None
            post_id = int(parts[1]) if len(parts) > 1 and parts[1] else None
            comment_id = int(parts[2]) if len(parts) > 2 and parts[2] else None

            group = groups_dict.get(abs(owner_id)) if owner_id and owner_id < 0 else None

            enriched = {
                "id": item["id"],
                "ownerId": owner_id,
                "postId": post_id,
                "vkCommentId": comment_id,
                "text": item.get("text"),
                "postText": post.get("text") if post else None,
                "createdAt": item.get("date"),
                "isRead": item.get("is_read"),
                "authorVkId": author_vk_id,
                "fromId": author_vk_id,
                "author": author,
                "group": group,
                "matchedKeywords": [
                    {"id": 0, "word": w, "category": "auto"}
                    for w in item.get("matched_keywords", [])
                ],
                "externalKey": item.get("external_key"),
            }
            enriched_items.append(enriched)

        return enriched_items


def get_comments_gateway_service() -> CommentsGatewayService:
    return CommentsGatewayService()
