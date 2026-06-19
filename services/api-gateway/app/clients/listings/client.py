from __future__ import annotations

from typing import Any

from app.clients.base import ServiceClient
from app.core.config import settings


class ListingsClient(ServiceClient):
    def __init__(self) -> None:
        from httpx import Timeout

        super().__init__(
            service_name="Listings",
            base_url=settings.listings_base_url,
            internal_token=settings.internal_service_token,
            timeout=Timeout(timeout=30.0, connect=5.0, read=30.0, write=10.0),
        )

    async def get_export_raw(
        self,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
        params: dict[str, Any] | None = None,
    ) -> Any:
        return await self._internal.raw_request(
            "GET",
            "/internal/content/listings/export",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            params=params,
        )
