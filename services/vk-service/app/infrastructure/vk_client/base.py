import asyncio
import logging
from collections.abc import Callable
from typing import Any

try:
    import vk_api
    from vk_api.exceptions import ApiError as VkApiLibraryError

    _VK_API_ERRORS = (VkApiLibraryError,)
except ImportError:  # pragma: no cover
    vk_api = None
    _VK_API_ERRORS = ()

from app.core.config import settings
from app.core.redaction import redact_secrets
from app.domain.exceptions.vk_api import map_vk_error
from app.domain.ports.vk_api import VkApiPort
from app.infrastructure.vk_client.session import TimeoutSession

logger = logging.getLogger("vk-service.vk_client")

VK_API_VERSION = "5.199"

# Backward-compatible alias: VkApiAdapter is the same as VkApiPort.
# The canonical name is VkApiPort (domain layer).
VkApiAdapter = VkApiPort


class VkApiConfigurationError(RuntimeError):
    pass


class VkApiBaseClient:
    def __init__(
        self,
        *,
        token: str | None = None,
        vk_session_factory: Callable[..., Any] | None = None,
        call_runner: Callable[..., Any] | None = None,
    ):
        self.token = token if token is not None else settings.vk_token
        self._vk_session_factory = vk_session_factory or self._default_vk_session_factory
        self._call_runner = call_runner or self._execute_in_thread
        self._api: Any = None
        self._api_lock = asyncio.Lock()
        self._request_lock = asyncio.Lock()

    def _default_vk_session_factory(self, **kwargs) -> Any:
        if vk_api is None:
            raise VkApiConfigurationError("vk_api package is not installed")
        return vk_api.VkApi(**kwargs)

    def _session_kwargs(self) -> dict[str, Any]:
        return {
            "token": self.token,
            "api_version": VK_API_VERSION,
            "session": TimeoutSession(settings.vk_api_timeout_seconds),
        }

    def _resolve_api(self) -> Any:
        """Resolve and cache the VK API object (synchronous, called from thread)."""
        if not self.token:
            raise VkApiConfigurationError("VK token is not configured")
        session = self._vk_session_factory(**self._session_kwargs())
        return session.get_api()

    def _call_sync(self, method: str, **params) -> dict:
        namespace, _, method_name = method.partition(".")
        if not method_name:
            raise ValueError(
                f"Invalid VK API method format: '{method}'. Expected 'namespace.method'."
            )

        api = self._api
        api_namespace = getattr(api, namespace, None)
        if api_namespace is None:
            raise ValueError(f"Unknown VK API namespace: '{namespace}'")

        api_method = getattr(api_namespace, method_name, None)
        if api_method is None:
            raise ValueError(f"Unknown VK API method: '{method}'")

        try:
            return api_method(**params)
        except _VK_API_ERRORS as exc:
            code = exc.code
            msg = exc.error.get("error_msg", "Unknown error")
            logger.warning("VK API error [%d]: %s (method=%s)", code, msg, method)
            raise map_vk_error(code, redact_secrets(msg), method) from exc
        except Exception as exc:
            raise RuntimeError(self._safe_error_message(exc)) from exc

    async def _call(self, method: str, **params) -> dict:
        # Thread-safe lazy initialization using double-checked locking.
        if self._api is None:
            async with self._api_lock:
                if self._api is None:
                    if not self.token:
                        raise VkApiConfigurationError("VK token is not configured")
                    session = self._vk_session_factory(**self._session_kwargs())
                    self._api = session.get_api()

        # vk_api reuses one requests.Session, which is not safe for concurrent threads.
        async with self._request_lock:
            return await self._call_runner(self._call_sync, method, **params)

    async def _execute_in_thread(self, sync_function: Callable, *args, **kwargs) -> Any:
        return await asyncio.to_thread(sync_function, *args, **kwargs)

    def _safe_error_message(self, exc: Exception) -> str:
        message = str(exc) or "VK API error"
        return redact_secrets(message)
