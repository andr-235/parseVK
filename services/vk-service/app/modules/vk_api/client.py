from typing import Protocol

import httpx

from app.core.config import settings

VK_API_VERSION = "5.199"


class VkApiAdapter(Protocol):
    async def get_groups(self, group_ids: list[int]) -> list[dict]:
        raise NotImplementedError

    async def get_posts(self, group_id: int, *, mode: str, post_limit: int | None) -> list[dict]:
        raise NotImplementedError

    async def get_comments(self, owner_id: int, post_id: int) -> list[dict]:
        raise NotImplementedError


class VkApiConfigurationError(RuntimeError):
    pass


class VkApiClient:
    def __init__(self, *, token: str | None = None, client: httpx.AsyncClient | None = None):
        self.token = token if token is not None else settings.vk_token
        self._client = client

    def _params(self, **params) -> dict:
        if not self.token:
            raise VkApiConfigurationError("VK token is not configured")
        return {"access_token": self.token, "v": VK_API_VERSION, **params}

    async def _get(self, method: str, **params) -> dict:
        if self._client is not None:
            response = await self._client.get(f"/method/{method}", params=self._params(**params))
        else:
            async with httpx.AsyncClient(base_url="https://api.vk.com", timeout=30) as client:
                response = await client.get(f"/method/{method}", params=self._params(**params))
        response.raise_for_status()
        payload = response.json()
        if "error" in payload:
            message = payload["error"].get("error_msg") or "VK API error"
            raise RuntimeError(message)
        return payload["response"]

    async def get_groups(self, group_ids: list[int]) -> list[dict]:
        if not group_ids:
            return []
        response = await self._get("groups.getById", group_ids=",".join(str(item) for item in group_ids))
        if isinstance(response, dict) and "groups" in response:
            return list(response["groups"])
        return list(response)

    async def get_posts(self, group_id: int, *, mode: str, post_limit: int | None) -> list[dict]:
        count = post_limit or 10
        owner_id = -abs(group_id)
        response = await self._get("wall.get", owner_id=owner_id, count=count)
        return list(response.get("items") or [])

    async def get_comments(self, owner_id: int, post_id: int) -> list[dict]:
        response = await self._get("wall.getComments", owner_id=owner_id, post_id=post_id, count=100)
        return list(response.get("items") or [])
