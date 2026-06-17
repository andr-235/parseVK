from __future__ import annotations

import time
import logging
from datetime import datetime
from typing import Any, Callable

import httpx

logger = logging.getLogger(__name__)


def _backoff_delays():
    delay = 1
    while True:
        yield delay
        delay = min(delay * 2, 60)


class BaseApiClient:
    def __init__(self, base_url: str, api_token: str, profile_id: str,
                 page_size: int = 100, request_timeout: int = 30):
        self._base_url = base_url.rstrip("/")
        self._profile_id = profile_id
        self._page_size = page_size
        self._request_timeout = request_timeout
        token = api_token.strip()
        if token.lower().startswith("bearer "):
            token = token[7:].strip()
        self._headers = {"Authorization": token, "Accept": "application/json"}

    def request_json(self, method: str, endpoint: str, params: dict) -> dict:
        url = f"{self._base_url}{endpoint}"
        for delay in _backoff_delays():
            try:
                kwargs: dict[str, Any] = {"params": params}
                if method.upper() == "POST":
                    kwargs["json"] = {}
                resp = httpx.request(
                    method, url, headers=self._headers, timeout=self._request_timeout, **kwargs
                )
                if resp.status_code in {408, 429, 500, 502, 503, 504}:
                    logger.warning("Retryable status %s, retry in %ss", resp.status_code, delay)
                    time.sleep(delay)
                    continue
                resp.raise_for_status()
                return resp.json()
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                logger.warning("Request failed (%s), retry in %ss", exc, delay)
                time.sleep(delay)
        raise RuntimeError("Retry loop exhausted")

    def paginate(self, endpoint: str, params: dict | Callable[[], dict], method: str = "GET") -> list[dict]:
        if callable(params):
            params = params()
        items: list[dict] = []
        offset = 0
        while True:
            page_params = {**params, "limit": self._page_size, "offset": offset}
            data = self.request_json(method, endpoint, page_params)
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
        return items

    @staticmethod
    def _extract_items(data: dict) -> list[dict]:
        for key in ("dialogs", "messages", "chats", "list", "items", "data"):
            if key in data and isinstance(data[key], list):
                return data[key]
        return []

    @staticmethod
    def format_message_date(timestamp: int) -> str:
        return datetime.utcfromtimestamp(timestamp).strftime("%Y-%m-%dT%H:%M:%S")

    @staticmethod
    def normalize_chat_id(chat_id: str) -> str:
        if chat_id.endswith("@g.us"):
            return chat_id.split("@", 1)[0]
        return chat_id

    def close(self) -> None:
        pass
