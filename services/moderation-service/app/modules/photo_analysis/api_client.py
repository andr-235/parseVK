import logging
from collections.abc import Callable
from typing import Any

import httpx
from app.modules.photo_analysis.clients import (
    ContentServiceClient,
    ImageModerationWebhookClient,
    VkServiceClient,
)
from app.modules.photo_analysis.schemas import AnalyzePhotosSchema

logger = logging.getLogger("moderation-service.photo-analysis.api-client")


class PhotoAnalysisClient:
    def __init__(self, http: Callable[[], httpx.AsyncClient]):
        self._http = http
        self._vk_client = VkServiceClient()
        self._content_client = ContentServiceClient()
        self._moderation_client = ImageModerationWebhookClient()

    async def prepare_photos(
        self,
        vk_user_id: int,
        options: AnalyzePhotosSchema,
    ) -> list[dict[str, Any]]:
        logger.debug("PhotoAnalysisClient.prepare_photos: vk_user_id=%d, options=%s", vk_user_id, options)
        count = options.limit or 100
        photos = await self._vk_client.get_user_photos(vk_user_id, count=count, offset=options.offset)
        logger.info("PhotoAnalysisClient.prepare_photos: got %d photos for user %d", len(photos), vk_user_id)
        return photos

    async def verify_author(self, vk_user_id: int) -> bool:
        logger.debug("PhotoAnalysisClient.verify_author: vk_user_id=%d", vk_user_id)
        result = await self._content_client.verify_author(vk_user_id)
        logger.info("PhotoAnalysisClient.verify_author: user %d verified=%s", vk_user_id, result)
        return result

    async def moderate_photos(self, image_urls: list[str]) -> list[dict[str, Any]]:
        logger.debug("PhotoAnalysisClient.moderate_photos: %d images", len(image_urls))
        results = await self._moderation_client.moderate_photos(image_urls)
        logger.info("PhotoAnalysisClient.moderate_photos: got %d results", len(results))
        return results
