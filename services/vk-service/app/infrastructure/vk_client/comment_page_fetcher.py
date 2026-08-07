import asyncio
import logging
import random
import re
from collections.abc import Callable
from typing import Any

import httpx

from app.domain.exceptions.vk_api import (
    VkApiDomainError,
    VkApiInfrastructureError,
    VkApiRateLimitError,
)

logger = logging.getLogger(__name__)


def redact_vk_error(message: str) -> str:
    return re.sub(
        r"(access_token=[^&\s]+|vk1\.[A-Za-z0-9_.\-]+|[a-fA-F0-9]{64,})",
        "<redacted>",
        message,
    )


class CommentPageFetcher:
    def __init__(self, call_method: Callable[..., Any]):
        self._call = call_method

    async def fetch(
        self,
        owner_id: int,
        post_id: int,
        offset: int,
        page_size: int,
        thread_items_count: int,
        *,
        max_retries: int,
        max_rate_limit_retries: int,
    ) -> dict:
        last_exc: Exception | None = None
        max_attempts = max(max_retries, max_rate_limit_retries)

        for attempt in range(1, max_attempts + 1):
            try:
                params: dict[str, Any] = {
                    "owner_id": owner_id,
                    "post_id": post_id,
                    "count": page_size,
                    "offset": offset,
                    "extended": 1,
                }
                if thread_items_count > 0:
                    params["thread_items_count"] = thread_items_count
                return await self._call("wall.getComments", **params)
            except (
                VkApiRateLimitError,
                VkApiInfrastructureError,
                httpx.RequestError,
            ) as exc:
                last_exc = exc
                is_rate_limit = isinstance(exc, VkApiRateLimitError)
                actual_max = (
                    max_rate_limit_retries if is_rate_limit else max_retries
                )
                if attempt >= actual_max:
                    logger.error(
                        "Retry exhaustion owner_id=%d post_id=%d offset=%d: %s",
                        owner_id,
                        post_id,
                        offset,
                        redact_vk_error(str(exc)),
                    )
                    raise
                jitter = 0.5 + random.random() * 0.5  # noqa: S311
                delay = min(2**attempt, 30) * jitter
                logger.warning(
                    "Transient VK error owner_id=%d post_id=%d offset=%d; "
                    "retrying in %.2fs (%d/%d): %s",
                    owner_id,
                    post_id,
                    offset,
                    delay,
                    attempt,
                    actual_max,
                    redact_vk_error(str(exc)),
                )
                await asyncio.sleep(delay)
            except VkApiDomainError as exc:
                if exc.code != 212:
                    raise
                logger.warning(
                    "Post %d_%d: access to comments denied (VK error 212), skipping",
                    owner_id,
                    post_id,
                )
                return {"items": [], "profiles": [], "groups": []}
            except (TimeoutError, asyncio.CancelledError):
                raise

        raise RuntimeError(
            "Unexpected comment-page retry loop exit for "
            f"owner_id={owner_id} post_id={post_id} offset={offset}"
        ) from last_exc
