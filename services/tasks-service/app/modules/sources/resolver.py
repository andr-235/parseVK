"""Source resolver port and internal VK resolver implementation.

Frontend-supplied normalized identities are NEVER trusted without resolver
validation (issue #283 AC). The port defines the contract; the internal VK
resolver validates against the VK source resolver contract shape
(``parsevk_contracts.vk.resolver``). The concrete vk-service callout is
deferred to P2 — for now the resolver validates structural rules locally.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Protocol
from uuid import UUID

logger = logging.getLogger(__name__)

VK_PROVIDER = "vk"
VK_SOURCE_TYPE = "community"


class ResolverError(Exception):
    """Base error for source resolution failures."""


class SourceNotFoundError(ResolverError):
    """Identity could not be resolved to a canonical source."""


@dataclass(frozen=True, slots=True)
class SourceIdentity:
    """Normalized identity supplied by the frontend."""

    provider: str
    source_type: str
    external_id: str

    def validate(self) -> None:
        """Structural validation mirroring the VK resolver contract."""
        if self.provider != VK_PROVIDER:
            raise SourceNotFoundError(f"Unsupported provider: {self.provider}")
        if self.source_type != VK_SOURCE_TYPE:
            raise SourceNotFoundError(f"Unsupported source type: {self.source_type}")
        if not self.external_id.isdigit() or not self.external_id.startswith("1"):
            raise SourceNotFoundError(f"Invalid external id: {self.external_id}")


@dataclass(frozen=True, slots=True)
class ResolvedSource:
    """Canonical source plus access scope, mirroring VkSourceResolverResponse."""

    source_id: UUID
    provider: str
    source_type: str
    external_id: str
    owner_id: int
    access_scope_id: UUID
    source_revision: int
    access_scope_revision: int


class SourceResolver(Protocol):
    """Resolves normalized identities to canonical sources with scope."""

    async def resolve(self, identity: SourceIdentity) -> ResolvedSource:
        """Return the canonical source for identity or raise SourceNotFoundError."""
        ...


class InternalVkSourceResolver:
    """Internal resolver delegating to the VK resolver contract shape.

    Concrete vk-service callout lands in P2; this implementation validates
    the identity structurally and raises SourceNotFoundError for identities
    that cannot be canonical.
    """

    async def resolve(self, identity: SourceIdentity) -> ResolvedSource:
        logger.debug("Resolving source identity: %s", identity)
        identity.validate()
        raise SourceNotFoundError(
            "Canonical resolution requires vk-service callout (deferred to P2)"
        )
