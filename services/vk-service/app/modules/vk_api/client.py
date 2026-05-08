import asyncio
from typing import Protocol

try:
    import vk_api
except ImportError:  # pragma: no cover - dependency is installed in the service image.
    vk_api = None

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
    def __init__(self, *, token: str | None = None, vk_session_factory=None, call_runner=None):
        self.token = token if token is not None else settings.vk_token
        self._vk_session_factory = vk_session_factory or self._default_vk_session_factory
        self._call_runner = call_runner or self._run_in_thread
        self._api = None

    def _default_vk_session_factory(self, **kwargs):
        if vk_api is None:
            raise VkApiConfigurationError("vk_api package is not installed")
        return vk_api.VkApi(**kwargs)

    def _get_api(self):
        if not self.token:
            raise VkApiConfigurationError("VK token is not configured")
        if self._api is None:
            session = self._vk_session_factory(token=self.token, api_version=VK_API_VERSION)
            self._api = session.get_api()
        return self._api

    def _call_sync(self, method: str, **params) -> dict:
        target = self._get_api()
        for part in method.split("."):
            target = getattr(target, part)
        try:
            return target(**params)
        except Exception as exc:
            raise RuntimeError(self._safe_error_message(exc)) from exc

    async def _call(self, method: str, **params) -> dict:
        return await self._call_runner(self._call_sync, method, **params)

    async def _run_in_thread(self, func, *args, **kwargs):
        return await asyncio.to_thread(func, *args, **kwargs)

    def _safe_error_message(self, exc: Exception) -> str:
        message = str(exc) or "VK API error"
        if self.token:
            message = message.replace(self.token, "<redacted>")
        return message

    async def get_groups(self, group_ids: list[int]) -> list[dict]:
        if not group_ids:
            return []
        response = await self._call("groups.getById", group_ids=",".join(str(item) for item in group_ids))
        if isinstance(response, dict) and "groups" in response:
            return list(response["groups"])
        return list(response)

    async def get_posts(self, group_id: int, *, mode: str, post_limit: int | None) -> list[dict]:
        count = post_limit or 10
        owner_id = -abs(group_id)
        response = await self._call("wall.get", owner_id=owner_id, count=count)
        return list(response.get("items") or [])

    async def get_comments(self, owner_id: int, post_id: int) -> list[dict]:
        response = await self._call("wall.getComments", owner_id=owner_id, post_id=post_id, count=100)
        return list(response.get("items") or [])
