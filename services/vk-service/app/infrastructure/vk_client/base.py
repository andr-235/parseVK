import asyncio
from typing import Protocol

try:
    import vk_api
except ImportError:  # pragma: no cover
    vk_api = None

from app.core.config import settings
from app.core.redaction import redact_secrets
from app.domain.ports.vk_api import VkApiPort

VK_API_VERSION = "5.199"

# Backward-compatible alias: VkApiAdapter is the same as VkApiPort.
# The canonical name is VkApiPort (domain layer).
VkApiAdapter = VkApiPort


class VkApiConfigurationError(RuntimeError):
    pass


class VkApiBaseClient:
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
        return redact_secrets(message)
