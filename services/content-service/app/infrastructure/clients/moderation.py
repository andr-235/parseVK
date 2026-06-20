import asyncio
import logging

import httpx

logger = logging.getLogger(__name__)


class ModerationPhotoSummaryClient:
    def __init__(
        self,
        client: httpx.AsyncClient,
        *,
        internal_token: str,
        enrichment_budget_seconds: float,
        max_concurrency: int = 5,
    ):
        self.client = client
        self.headers = {"X-Internal-Service-Token": internal_token}
        self.enrichment_budget_seconds = enrichment_budget_seconds
        self.max_concurrency = max(max_concurrency, 1)

    async def summaries_by_vk_author_ids(
        self,
        vk_author_ids: list[int],
    ) -> dict[int, dict]:
        if not vk_author_ids:
            return {}
        try:
            response = await self.client.post(
                "/photo-analysis/bulk-summaries",
                json={"vk_author_ids": vk_author_ids},
                headers=self.headers,
            )
            response.raise_for_status()
            payload = response.json()
            return {int(key): value for key, value in payload.items()}
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning(
                "Bulk photo summaries unavailable; using single requests: %s",
                type(exc).__name__,
            )
            return await self._single_summaries(vk_author_ids)

    async def _single_summaries(self, ids: list[int]) -> dict[int, dict]:
        semaphore = asyncio.Semaphore(self.max_concurrency)

        async def fetch(vk_author_id: int):
            try:
                async with semaphore:
                    response = await self.client.get(
                        f"/photo-analysis/vk/{vk_author_id}/summary",
                        headers=self.headers,
                    )
                    response.raise_for_status()
                    return vk_author_id, response.json()
            except (httpx.HTTPError, ValueError) as exc:
                logger.warning(
                    "Photo summary unavailable: author_id=%s error_type=%s",
                    vk_author_id,
                    type(exc).__name__,
                )
                return vk_author_id, None

        values = await asyncio.gather(*(fetch(value) for value in ids))
        return {key: value for key, value in values if value is not None}
