import logging
import httpx
from app.core.config import settings

logger = logging.getLogger("moderation-service.photo-analysis.clients")


class VkServiceClient:
    def __init__(self):
        self.base_url = settings.vk_service_base_url
        self.headers = {"X-Internal-Service-Token": settings.internal_service_token}

    async def get_user_photos(self, vk_user_id: int, count: int = 100, offset: int = 0) -> list[dict]:
        url = f"{self.base_url}/internal/vk/users/{vk_user_id}/photos"
        params = {"count": count, "offset": offset}
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, params=params, headers=self.headers, timeout=15.0)
                if resp.status_code == 404:
                    return []
                resp.raise_for_status()
                return resp.json()
        except Exception as exc:
            logger.error(
                "Failed to contact vk-service for user photos: error_type=%s",
                type(exc).__name__,
            )
            raise exc


class ContentServiceClient:
    def __init__(self):
        self.base_url = settings.content_service_base_url
        self.headers = {"X-Internal-Service-Token": settings.internal_service_token}

    async def verify_author(self, vk_author_id: int) -> bool:
        url = f"{self.base_url}/internal/content/authors/{vk_author_id}/verify"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.patch(url, headers=self.headers, timeout=5.0)
                if resp.status_code == 200:
                    return True
                logger.warning(
                    "Content-service verify returned status %s", resp.status_code
                )
        except Exception as exc:
            logger.error(
                "Failed to contact content-service for verify author: error_type=%s",
                type(exc).__name__,
            )
        return False


class ImageModerationWebhookClient:
    def __init__(self):
        self.url = settings.image_moderation_webhook_url
        self.timeout = settings.image_moderation_timeout_seconds
        self.retries = settings.image_moderation_retry_count
        self.verify_ssl = settings.image_moderation_verify_ssl

    async def moderate_photos(self, image_urls: list[str]) -> list[dict]:
        if not image_urls:
            return []

        # Security: mask sensitive parameters in image URLs for logging
        masked_urls = [self._mask_url(url) for url in image_urls]
        logger.info(
            f"Sending request to image moderation webhook with {len(image_urls)} images: {masked_urls}"
        )

        payload = {"imageUrls": image_urls}

        for attempt in range(self.retries):
            try:
                async with httpx.AsyncClient(verify=self.verify_ssl) as client:
                    resp = await client.post(
                        self.url,
                        json=payload,
                        timeout=self.timeout
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    
                    if not isinstance(data, dict) or "results" not in data:
                        raise ValueError("Response does not contain 'results'")
                        
                    return data["results"]
            except Exception as exc:
                logger.warning(
                    "Attempt %s/%s failed for image moderation webhook: error_type=%s",
                    attempt + 1,
                    self.retries,
                    type(exc).__name__,
                )
                if attempt == self.retries - 1:
                    logger.error("All attempts to image moderation webhook failed")
                    raise exc

        return []

    def _mask_url(self, url: str) -> str:
        try:
            from urllib.parse import urlparse, urlunparse
            parsed = urlparse(url)
            return urlunparse((parsed.scheme, parsed.netloc, parsed.path, '', '', ''))
        except Exception:
            return "<invalid-url>"
