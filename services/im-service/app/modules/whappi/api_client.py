"""Async HTTP client for Wappi.pro and Max API with tenacity retry.

Public interface:
    - BaseApiClient(base_url, api_token, profile_id, page_size=100,
                    request_timeout=30, max_retries=7)
        * request_json(method, endpoint, params=None) -> Any
        * paginate(endpoint, params, method="GET") -> list[dict]
        * close()

Retry behaviour:
    - Retry on statuses: 408, 429, 500, 502, 503, 504
    - Retry on httpx.TimeoutException, httpx.TransportError
    - Exponential backoff: 1s → 60s, stop after max_retries (default 7)
    - Retry configuration is injectable via constructor params
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any

__all__ = ["BaseApiClient"]

import httpx
import tenacity

logger = logging.getLogger(__name__)

_RETRYABLE_STATUSES = frozenset({408, 429, 500, 502, 503, 504})


def _is_retryable(exc: BaseException) -> bool:
    if isinstance(exc, (httpx.TimeoutException, httpx.TransportError)):
        return True
    if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code in _RETRYABLE_STATUSES:
        return True
    return False


class BaseApiClient:
    def __init__(
        self,
        base_url: str,
        api_token: str,
        profile_id: str,
        page_size: int = 100,
        request_timeout: int = 30,
        max_retries: int = 7,
    ):
        self._base_url = base_url.rstrip("/")
        self._profile_id = profile_id
        self._page_size = page_size
        token = api_token.strip()
        if token.lower().startswith("bearer "):
            token = token[7:].strip()
        headers = {"Authorization": token, "Accept": "application/json"}
        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            headers=headers,
            timeout=httpx.Timeout(request_timeout),
        )
        self._retry = tenacity.AsyncRetrying(
            retry=tenacity.retry_if_exception(_is_retryable),
            wait=tenacity.wait_exponential(multiplier=1, min=1, max=60),
            stop=tenacity.stop_after_attempt(max_retries),
            before_sleep=tenacity.before_sleep_log(logger, logging.WARNING),
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def request_json(self, method: str, endpoint: str, params: dict | None = None) -> Any:
        logger.debug("HTTP %s %s params=%s", method, endpoint, params)
        try:
            async for attempt in self._retry:
                with attempt:
                    response = await self._client.request(method, endpoint, params=params)
                    response.raise_for_status()
        except tenacity.RetryError as exc:
            if exc.last_attempt.failed:
                raise exc.last_attempt.exception() from exc
            raise
        return response.json()

    async def paginate(
        self, endpoint: str, params: dict | Callable[[], dict], method: str = "GET",
    ) -> list[dict]:
        resolved = params() if callable(params) else params
        items: list[dict] = []
        offset = 0
        while True:
            page_params = {**resolved, "limit": self._page_size, "offset": offset}
            data = await self.request_json(method, endpoint, page_params)
            page = self._extract_items(data)
            if not page:
                break
            items.extend(page)
            offset += len(page)
            total = data.get("total_count") or data.get("total")
            if total is not None and offset >= total:
                break
            if len(page) < self._page_size:
                break
        logger.info("Paginated %d items from %s", len(items), endpoint)
        return items

    @staticmethod
    def _extract_items(data: dict) -> list[dict]:
        for key in ("dialogs", "messages", "chats", "list", "items", "data"):
            if key in data and isinstance(data[key], list):
                return data[key]
        return []

    @staticmethod
    def format_message_date(timestamp: int) -> str:
        return datetime.fromtimestamp(timestamp, tz=UTC).strftime("%Y-%m-%dT%H:%M:%S")

    @staticmethod
    def normalize_chat_id(chat_id: str) -> str:
        if chat_id.endswith("@g.us"):
            return chat_id.split("@", 1)[0]
        return chat_id
