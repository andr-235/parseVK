import asyncio
import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class PhotoAnalysisClient:
    def __init__(self, base_url: str | None = None):
        self.base_url = (base_url if base_url is not None else settings.photo_analysis_base_url)
        self.timeout = settings.photo_analysis_timeout_seconds
        self.max_concurrency = max(settings.photo_analysis_max_concurrency, 1)
        self.enrichment_budget_seconds = settings.photo_analysis_enrichment_budget_seconds

    async def summaries_by_vk_author_ids(
        self,
        vk_author_ids: list[int],
    ) -> dict[int, dict[str, Any]]:
        if not self.base_url or not vk_author_ids:
            return {}

        headers = {"X-Internal-Service-Token": settings.internal_service_token}

        # 1. Try bulk request to moderation-service
        try:
            async with httpx.AsyncClient(
                base_url=self.base_url.rstrip("/"),
                timeout=httpx.Timeout(timeout=self.timeout, connect=min(self.timeout, 1.0)),
            ) as client:
                response = await client.post(
                    "/photo-analysis/bulk-summaries",
                    json={"vk_author_ids": vk_author_ids},
                    headers=headers,
                )
                if response.status_code == 200:
                    data = response.json()
                    return {int(k): v for k, v in data.items()}
                else:
                    logger.warning(
                        "Bulk photo analysis summaries failed with status %s: %s. Falling back to single queries.",
                        response.status_code,
                        response.text,
                    )
        except Exception as exc:
            logger.warning(
                "Bulk photo analysis summaries failed: %s. Falling back to single queries.",
                exc,
            )

        # 2. Fallback to parallel single queries
        async with httpx.AsyncClient(
            base_url=self.base_url.rstrip("/"),
            timeout=httpx.Timeout(timeout=self.timeout, connect=min(self.timeout, 1.0)),
        ) as client:
            semaphore = asyncio.Semaphore(self.max_concurrency)

            async def fetch_summary(vk_author_id: int) -> tuple[int, dict[str, Any] | None]:
                try:
                    async with semaphore:
                        response = await client.get(
                            f"/photo-analysis/vk/{vk_author_id}/summary",
                            headers=headers
                        )
                        response.raise_for_status()
                        return vk_author_id, response.json()
                except (httpx.HTTPError, ValueError) as exc:
                    logger.warning(
                        "Photo analysis summary unavailable for author %s: %s",
                        vk_author_id,
                        exc,
                    )
                    return vk_author_id, None

            results = await asyncio.gather(
                *(fetch_summary(vk_author_id) for vk_author_id in vk_author_ids)
            )
        summaries: dict[int, dict[str, Any]] = {}
        for vk_author_id, summary in results:
            if summary is not None:
                summaries[vk_author_id] = summary
        return summaries

