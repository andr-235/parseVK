import logging
from collections.abc import Callable
from typing import Any

logger = logging.getLogger("api-gateway.watchlist.crud")


class WatchlistCrudService:
    def __init__(
        self,
        moderation_client: Any,
        content_client: Any,
        on_enrich: Callable,
    ):
        self._moderation_client = moderation_client
        self._content_client = content_client
        self.on_enrich = on_enrich

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
        status_details: dict[int, str] | None = None,
    ) -> dict:
        logger.debug("WatchlistCrudService.moderation_request: %s %s", method, path)
        return await self._moderation_client.request(
            method, path,
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            params=params,
            json=json,
        )

    async def _default_enrich(self, records: list[dict], **kw: Any) -> list[dict]:
        logger.debug("WatchlistCrudService._default_enrich: %d records", len(records))
        if not records:
            return records
        return records
