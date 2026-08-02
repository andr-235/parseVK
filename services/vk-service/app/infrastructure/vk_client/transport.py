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
from app.domain.entities.credentials import CredentialMaterial
from app.domain.exceptions.vk_api import VkApiInfrastructureError, map_vk_error
from app.infrastructure.vk_client.session import TimeoutSession

logger = logging.getLogger("vk-service.vk_client")

VK_API_VERSION = "5.199"


class VkApiConfigurationError(RuntimeError):
    pass


class VkTransport:
    """Low-level VK transport with one cached session per credential version."""

    def __init__(
        self,
        *,
        vk_session_factory: Callable[..., Any] | None = None,
        call_runner: Callable[..., Any] | None = None,
        timeout_seconds: float | None = None,
    ):
        self._vk_session_factory = vk_session_factory or self._default_vk_session_factory
        self._call_runner = call_runner or self._execute_in_thread
        self._timeout_seconds = (
            timeout_seconds
            if timeout_seconds is not None
            else settings.vk_api_timeout_seconds
        )
        self._apis: dict[str, Any] = {}
        self._api_lock = asyncio.Lock()

    def _default_vk_session_factory(self, **kwargs) -> Any:
        if vk_api is None:
            raise VkApiConfigurationError("vk_api package is not installed")
        return vk_api.VkApi(**kwargs)

    def _session_kwargs(self, credential: CredentialMaterial) -> dict[str, Any]:
        return {
            "token": credential.raw_secret,
            "api_version": VK_API_VERSION,
            "session": TimeoutSession(self._timeout_seconds),
        }

    def _resolve_api(self, credential: CredentialMaterial) -> Any:
        session = self._vk_session_factory(**self._session_kwargs(credential))
        return session.get_api()

    async def _api_for(self, credential: CredentialMaterial) -> Any:
        version = credential.version_digest
        api = self._apis.get(version)
        if api is not None:
            return api
        async with self._api_lock:
            api = self._apis.get(version)
            if api is None:
                api = self._resolve_api(credential)
                self._apis[version] = api
            return api

    def _call_sync(self, api: Any, method: str, **params) -> dict:
        namespace, _, method_name = method.partition(".")
        if not method_name:
            raise ValueError(
                f"Invalid VK API method format: '{method}'. Expected 'namespace.method'."
            )

        api_namespace = getattr(api, namespace, None)
        if api_namespace is None:
            raise ValueError(f"Unknown VK API namespace: '{namespace}'")

        api_method = getattr(api_namespace, method_name, None)
        if api_method is None:
            raise ValueError(f"Unknown VK API method: '{method}'")

        try:
            logger.debug("VK API call: %s", method)
            return api_method(**params)
        except _VK_API_ERRORS as exc:
            code = exc.code
            msg = exc.error.get("error_msg", "Unknown error")
            logger.warning("VK API error [%d]: %s (method=%s)", code, msg, method)
            raise map_vk_error(code, redact_secrets(msg), method) from exc
        except Exception as exc:
            from httpx import RequestError as HttpxRequestError

            msg = self._safe_error_message(exc)
            if isinstance(
                exc,
                (ConnectionError, TimeoutError, HttpxRequestError, OSError),
            ):
                raise VkApiInfrastructureError(0, msg) from exc
            raise RuntimeError(msg) from exc

    async def call(
        self, credential: CredentialMaterial, method: str, **params
    ) -> dict:
        if not credential.raw_secret:
            raise VkApiConfigurationError("VK token is not configured")
        api = await self._api_for(credential)
        return await self._call_runner(self._call_sync, api, method, **params)

    async def _execute_in_thread(self, sync_function: Callable, *args, **kwargs) -> Any:
        return await asyncio.to_thread(sync_function, *args, **kwargs)

    def _safe_error_message(self, exc: Exception) -> str:
        message = str(exc) or "VK API error"
        return redact_secrets(message)
