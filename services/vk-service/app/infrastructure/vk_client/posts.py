import logging
from collections.abc import AsyncIterator, Callable
from datetime import datetime
from typing import Any

from app.domain.exceptions.vk_api import VkApiDomainError
from app.infrastructure.vk_client.author_comments import AuthorCommentsClient
from app.infrastructure.vk_client.comment_pages import CommentPagesClient

logger = logging.getLogger(__name__)


class PostsClient:
    def __init__(self, call_method: Callable[..., Any]):
        self._call = call_method
        self._comment_pages = CommentPagesClient(self._call_current)
        self._author_comments = AuthorCommentsClient(self._call_current)

    async def _call_current(self, method: str, **params) -> dict:
        return await self._call(method, **params)

    async def get_posts(
        self,
        group_id: int,
        *,
        mode: str,
        post_limit: int | None,
    ) -> dict:
        count = post_limit or 10
        response = await self._call(
            "wall.get",
            owner_id=-abs(group_id),
            count=count,
            extended=1,
        )
        return self._entities(response)

    async def get_comments(self, owner_id: int, post_id: int) -> dict:
        try:
            response = await self._call(
                "wall.getComments",
                owner_id=owner_id,
                post_id=post_id,
                count=100,
                extended=1,
            )
        except VkApiDomainError as exc:
            if exc.code != 212:
                raise
            logger.warning(
                "Post %d_%d: access to comments denied (VK error 212), skipping",
                owner_id,
                post_id,
            )
            return self._entities({})
        return self._entities(response)

    async def iter_comment_pages(
        self,
        owner_id: int,
        post_id: int,
        start_offset: int = 0,
        page_size: int = 100,
        max_retries: int = 3,
        max_rate_limit_retries: int = 5,
        thread_items_count: int = 0,
    ) -> AsyncIterator[dict]:
        async for page in self._comment_pages.iter_pages(
            owner_id,
            post_id,
            start_offset=start_offset,
            page_size=page_size,
            max_retries=max_retries,
            max_rate_limit_retries=max_rate_limit_retries,
            thread_items_count=thread_items_count,
        ):
            yield page

    async def get_author_comments_for_post(
        self,
        owner_id: int,
        post_id: int,
        author_vk_id: int,
        baseline: datetime | None = None,
        batch_size: int = 100,
        max_pages: int = 10,
        thread_items_count: int = 10,
    ) -> list[dict]:
        return await self._author_comments.collect(
            owner_id,
            post_id,
            author_vk_id,
            baseline=baseline,
            batch_size=batch_size,
            max_pages=max_pages,
            thread_items_count=thread_items_count,
        )

    @staticmethod
    def _entities(response: dict) -> dict:
        return {
            "items": list(response.get("items") or []),
            "profiles": list(response.get("profiles") or []),
            "groups": list(response.get("groups") or []),
        }
