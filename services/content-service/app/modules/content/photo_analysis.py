import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class PhotoAnalysisClient:
    def __init__(self, base_url: str | None = None):
        self.base_url = (base_url if base_url is not None else settings.photo_analysis_base_url)
        self.timeout = settings.photo_analysis_timeout_seconds

    async def summaries_by_vk_author_ids(
        self,
        vk_author_ids: list[int],
    ) -> dict[int, dict[str, Any]]:
        if not self.base_url or not vk_author_ids:
            return {}

        summaries: dict[int, dict[str, Any]] = {}
        async with httpx.AsyncClient(
            base_url=self.base_url.rstrip("/"),
            timeout=httpx.Timeout(timeout=self.timeout, connect=min(self.timeout, 1.0)),
        ) as client:
            for vk_author_id in vk_author_ids:
                try:
                    response = await client.get(f"/photo-analysis/vk/{vk_author_id}/summary")
                    response.raise_for_status()
                    summaries[vk_author_id] = response.json()
                except (httpx.HTTPError, ValueError) as exc:
                    logger.warning(
                        "Photo analysis summary unavailable for author %s: %s",
                        vk_author_id,
                        exc,
                    )
        return summaries
