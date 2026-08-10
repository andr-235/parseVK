import logging
from collections.abc import AsyncIterator, Callable
from typing import Any

from app.infrastructure.vk_client.comment_page_fetcher import CommentPageFetcher

logger = logging.getLogger(__name__)


class CommentPagesClient:
    def __init__(self, call_method: Callable[..., Any]):
        self._fetcher = CommentPageFetcher(call_method)

    async def iter_pages(
        self,
        owner_id: int,
        post_id: int,
        start_offset: int = 0,
        page_size: int = 100,
        max_retries: int = 3,
        max_rate_limit_retries: int = 5,
        thread_items_count: int = 0,
    ) -> AsyncIterator[dict]:
        offset = start_offset
        page_count = 0

        while True:
            page_count += 1
            response = await self._fetcher.fetch(
                owner_id,
                post_id,
                offset,
                page_size,
                thread_items_count,
                max_retries=max_retries,
                max_rate_limit_retries=max_rate_limit_retries,
            )
            items = response.get("items") or []
            profiles = response.get("profiles") or []
            groups = response.get("groups") or []
            page = {
                "items": list(items),
                "profiles": list(profiles),
                "groups": list(groups),
            }
            if items:
                page.update(
                    {
                        key: value
                        for key, value in response.items()
                        if key not in {"items", "profiles", "groups"}
                    }
                )
            yield page

            if not items:
                break
            offset += len(items)
            total_count = response.get("count", 0)
            if offset >= total_count:
                break

        logger.debug(
            "Collected comment pages owner_id=%d post_id=%d pages=%d",
            owner_id,
            post_id,
            page_count,
        )
