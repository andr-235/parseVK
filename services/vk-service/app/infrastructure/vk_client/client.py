"""VkApiClient facade over the fair scheduler and transport with bound clients.

The shared client is unbound: direct calls fail fast with
``ProviderContextMissingError``. Per-task execution goes through
``shared.bind(ProviderRequestContext(...))`` which returns an immutable
``BoundVkApiClient`` carrying the account context into the scheduler.
"""

import logging

from app.core.config import settings
from app.domain.entities.credentials import CredentialMaterial
from app.infrastructure.vk_client.base import (
    ProviderContextMissingError,
    ProviderRequestContext,
    _VkApiCallSurface,
    current_request_context,
    request_context,
)
from app.infrastructure.vk_client.friends import FriendsClient
from app.infrastructure.vk_client.groups import GroupsClient
from app.infrastructure.vk_client.posts import PostsClient
from app.infrastructure.vk_client.transport import VkApiConfigurationError, VkTransport
from app.infrastructure.vk_client.users import UsersClient

logger = logging.getLogger(__name__)

__all__ = [
    "VkApiClient",
    "BoundVkApiClient",
    "ProviderRequestContext",
    "ProviderContextMissingError",
    "current_request_context",
    "VkApiConfigurationError",
]


class VkApiClient(_VkApiCallSurface):
    """Shared facade owning the scheduler and transport; produces bound clients.

    Backward-compatible constructor kwargs (``token``, ``vk_session_factory``,
    ``call_runner``) build an internal transport/scheduler when none is given.
    """

    def __init__(
        self,
        *,
        secret_provider=None,
        scheduler=None,
        transport: VkTransport | None = None,
        token: str | None = None,
        vk_session_factory=None,
        call_runner=None,
    ):
        # Lazy imports: app.services.* runs the package __init__ which imports
        # back into this module — must not execute at module load time.
        if scheduler is None:
            from app.services.vk_retry_policy import VkRetryPolicy
            from app.services.vk_scheduler import FairScheduler

            scheduler = FairScheduler(VkRetryPolicy(settings))
        self._secret_provider = secret_provider
        self._transport = transport or VkTransport(
            vk_session_factory=vk_session_factory, call_runner=call_runner
        )
        self._scheduler = scheduler
        self._fallback_credential = (
            CredentialMaterial.from_secret(token) if token else None
        )
        self._groups = GroupsClient(self._call)
        self._posts = PostsClient(self._call)
        self._users = UsersClient(self._call)
        self._friends = FriendsClient(self._call)

    def bind(self, context: ProviderRequestContext) -> "BoundVkApiClient":
        credential = self._resolve_credential()
        logger.debug(
            "binding vk client account=%s lane=%s credential=%s",
            context.account_id,
            context.lane_id,
            credential.display_version,
        )
        return BoundVkApiClient(
            scheduler=self._scheduler,
            transport=self._transport,
            credential=credential,
            context=context,
        )

    def _resolve_credential(self) -> CredentialMaterial:
        if self._secret_provider is not None:
            return self._secret_provider.load()
        if self._fallback_credential is not None:
            return self._fallback_credential
        raise VkApiConfigurationError("VK token is not configured")

    @property
    def credential_version(self) -> str:
        return self._resolve_credential().version_digest

    @property
    def display_version(self) -> str:
        return self._resolve_credential().display_version

    async def _call(self, method: str, **params) -> dict:
        logger.warning(
            "unbound VkApiClient used for %s; bind() with a ProviderRequestContext first",
            method,
        )
        raise ProviderContextMissingError(
            f"unbound VkApiClient used for {method}; call bind() with a "
            "ProviderRequestContext first"
        )


class BoundVkApiClient(_VkApiCallSurface):
    """Immutable per-task facade: fixed context + shared scheduler/transport."""

    def __init__(
        self,
        *,
        scheduler,
        transport: VkTransport,
        credential: CredentialMaterial,
        context: ProviderRequestContext,
    ):
        self._scheduler = scheduler
        self._transport = transport
        self._credential = credential
        self._context = context
        self._groups = GroupsClient(self._call)
        self._posts = PostsClient(self._call)
        self._users = UsersClient(self._call)
        self._friends = FriendsClient(self._call)

    @property
    def context(self) -> ProviderRequestContext:
        return self._context

    async def _call(self, method: str, **params) -> dict:
        with request_context(self._context):
            async def transport_call():
                return await self._transport.call(self._credential, method, **params)

            transport_call.method = method
            return await self._scheduler.execute(
                self._context.account_id, self._context.lane_id, transport_call
            )
