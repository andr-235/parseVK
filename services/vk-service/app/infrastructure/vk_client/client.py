"""VK API facade with immutable provider-bound client instances."""

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
    "CredentialVersionMismatchError",
    "current_request_context",
    "VkApiConfigurationError",
]


class CredentialVersionMismatchError(VkApiConfigurationError):
    """Raised when audited attempt metadata and loaded secret disagree."""


class VkApiClient(_VkApiCallSurface):
    """Shared facade owning the scheduler and transport.

    ``bind`` remains compatible with legacy callers that supply opaque version
    labels. Digest-shaped metadata is still checked. Runtime and HTTP execution
    use ``bind_snapshot`` and always require an exact persisted version match.
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
        if scheduler is None:
            from app.services.vk_retry_policy import VkRetryPolicy
            from app.services.vk_scheduler import FairScheduler

            scheduler = FairScheduler(VkRetryPolicy(settings))
        self._secret_provider = secret_provider
        self._transport = transport or VkTransport(
            vk_session_factory=vk_session_factory,
            call_runner=call_runner,
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
        """Bind legacy callers while validating real SHA-256 version labels."""
        credential = self._resolve_credential()
        if len(context.credential_version) == 64:
            self._ensure_version_matches(credential, context)
        return self._build_bound(credential, context)

    def bind_snapshot(
        self, context: ProviderRequestContext
    ) -> "BoundVkApiClient":
        """Bind the current secret only when it matches persisted metadata."""
        credential = self._resolve_credential()
        self._ensure_version_matches(credential, context)
        return self._build_bound(credential, context)

    def bind_credential(
        self,
        credential: CredentialMaterial,
        context: ProviderRequestContext,
    ) -> "BoundVkApiClient":
        """Bind exact material, used by isolated candidate validation."""
        self._ensure_version_matches(credential, context)
        return self._build_bound(credential, context)

    def bind_current(self, account_id: str, lane_id: str) -> "BoundVkApiClient":
        credential = self._resolve_credential()
        return self._build_bound(
            credential,
            ProviderRequestContext(
                account_id=account_id,
                credential_version=credential.version_digest,
                lane_id=lane_id,
            ),
        )

    @staticmethod
    def _ensure_version_matches(
        credential: CredentialMaterial,
        context: ProviderRequestContext,
    ) -> None:
        if context.credential_version == credential.version_digest:
            return
        expected = context.credential_version[:12] or "(missing)"
        raise CredentialVersionMismatchError(
            "provider credential version mismatch for "
            f"{context.account_id}: expected {expected}, "
            f"loaded {credential.display_version}"
        )

    def _build_bound(
        self,
        credential: CredentialMaterial,
        context: ProviderRequestContext,
    ) -> "BoundVkApiClient":
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
            "unbound VkApiClient used for %s; bind with provider context first",
            method,
        )
        raise ProviderContextMissingError(
            f"unbound VkApiClient used for {method}; bind with a "
            "ProviderRequestContext first"
        )


class BoundVkApiClient(_VkApiCallSurface):
    """Immutable per-task facade with fixed context and credential material."""

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

    @property
    def credential_version(self) -> str:
        return self._credential.version_digest

    @property
    def display_version(self) -> str:
        return self._credential.display_version

    async def _call(self, method: str, **params) -> dict:
        with request_context(self._context):

            async def transport_call():
                return await self._transport.call(
                    self._credential,
                    method,
                    **params,
                )

            transport_call.method = method
            return await self._scheduler.execute(
                self._context.account_id,
                self._context.lane_id,
                transport_call,
            )
