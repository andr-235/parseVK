from __future__ import annotations

from typing import Any

from app.clients.base import ServiceClient
from app.core.config import settings


class ContentServiceClient(ServiceClient):
    def __init__(self) -> None:
        from httpx import Timeout

        super().__init__(
            service_name="Content",
            base_url=settings.content_base_url,
            internal_token=settings.internal_service_token,
            timeout=Timeout(timeout=10.0, connect=2.0, read=10.0, write=5.0),
        )

    async def bulk_get_groups(
        self,
        vk_author_ids: list[int],
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> list[dict[str, Any]]:
        """Fetch existing groups by VK IDs.

        Thin HTTP wrapper — no business logic.
        Returns raw response for service-level processing.
        """
        result = await self.request(
            "POST",
            "/internal/content/groups/bulk",
            json=vk_author_ids,
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return result if isinstance(result, list) else []
