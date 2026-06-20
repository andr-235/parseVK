import logging

import httpx

logger = logging.getLogger(__name__)


class VkProfilesHttpClient:
    def __init__(self, client: httpx.AsyncClient, *, internal_token: str):
        self.client = client
        self.headers = {"X-Internal-Service-Token": internal_token}

    async def get_profiles(
        self,
        vk_author_ids: list[int],
        fields: list[str],
    ) -> list[dict]:
        logger.debug("Requesting VK profiles: count=%d", len(vk_author_ids))
        response = await self.client.post(
            "/internal/vk/users/bulk",
            json={"user_ids": vk_author_ids, "fields": fields},
            headers=self.headers,
        )
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, list):
            raise ValueError("VK profiles response must be a list")
        return payload
