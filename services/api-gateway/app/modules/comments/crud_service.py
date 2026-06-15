import logging
from collections.abc import Callable
from typing import Any

logger = logging.getLogger("api-gateway.comments.crud")


class CommentCrudService:
    def __init__(
        self,
        moderation_client: Any,
        content_client: Any,
        enrich: Callable,
    ):
        self._moderation_client = moderation_client
        self._content_client = content_client
        self.enrich = enrich

    async def moderation_request(
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
        logger.debug("CommentCrudService.moderation_request: %s %s", method, path)
        return await self._moderation_client.request(
            method, path,
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            params=params,
            json=json,
        )

    async def enrich_comments(
        self,
        items: list[dict],
        **kw: Any,
    ) -> list[dict]:
        logger.debug("CommentCrudService.enrich_comments: %d items", len(items))
        if not items:
            return items
        return items

    def group_by_post(self, raw_items: list[dict], query: str | None = None) -> list[dict]:
        logger.debug("CommentCrudService.group_by_post: %d items", len(raw_items))
        grouped: dict[str, dict] = {}
        for item in raw_items:
            post_id = item.get("post_id") or item.get("postId") or "unknown"
            if post_id not in grouped:
                grouped[post_id] = {
                    "postId": post_id,
                    "postText": item.get("post_text") or item.get("postText", ""),
                    "comments": [],
                }
            grouped[post_id]["comments"].append(format_comment_for_group(item))
        return list(grouped.values())

    def format_comment_search_item(self, item: dict, query: str | None = None) -> dict:
        return {
            "id": item.get("id"),
            "text": item.get("text", ""),
            "authorVkId": item.get("author_vk_id") or item.get("authorVkId"),
            "authorName": item.get("author_name") or item.get("authorName", "Unknown"),
            "postId": item.get("post_id") or item.get("postId"),
            "postText": item.get("post_text") or item.get("postText", ""),
            "date": item.get("date") or item.get("created_at"),
            "readStatus": item.get("read_status") if item.get("read_status") is not None else item.get("readStatus"),
        }


def format_comment_for_group(item: dict) -> dict:
    return {
        "id": item.get("id"),
        "text": item.get("text", ""),
        "authorVkId": item.get("author_vk_id") or item.get("authorVkId"),
        "authorName": item.get("author_name") or item.get("authorName", "Unknown"),
        "date": item.get("date") or item.get("created_at"),
        "readStatus": item.get("read_status") if item.get("read_status") is not None else item.get("readStatus"),
    }
