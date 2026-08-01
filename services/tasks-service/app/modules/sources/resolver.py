"""Source resolver port and internal VK resolver implementation.

Frontend-supplied normalized identities are never trusted directly. The
resolver validates them and returns the canonical values that services must
persist and compare. A real vk-service lookup can replace the internal
implementation without changing the service boundary.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Protocol
from uuid import NAMESPACE_URL, UUID, uuid5

logger = logging.getLogger(__name__)

VK_PROVIDER = "vk"
VK_SOURCE_TYPE = "community"


class ResolverError(Exception):
    """Base error for source resolution failures."""


class SourceNotFoundError(ResolverError):
    """Identity could not be resolved to a canonical source."""


def canonical_external_id(external_id: str) -> str:
    """Return the canonical positive decimal representation."""
    if not external_id.isdigit() or int(external_id) <= 0:
        raise SourceNotFoundError(f"Invalid external id: {external_id}")
    return str(int(external_id))


def canonical_source_id(provider: str, source_type: str, external_id: str) -> UUID:
    """Derive a stable UUID from the complete canonical global identity."""
    normalized_external_id = canonical_external_id(external_id)
    canonical_key = f"parsevk:{provider}:{source_type}:{normalized_external_id}"
    return uuid5(NAMESPACE_URL, canonical_key)


@dataclass(frozen=True, slots=True)
class SourceIdentity:
    """Normalized identity supplied by a caller."""

    provider: str
    source_type: str
    external_id: str

    def validate(self) -> None:
        """Validate the supported provider/type and positive external id."""
        if self.provider != VK_PROVIDER:
            raise SourceNotFoundError(f"Unsupported provider: {self.provider}")
        if self.source_type != VK_SOURCE_TYPE:
            raise SourceNotFoundError(f"Unsupported source type: {self.source_type}")
        canonical_external_id(self.external_id)


@dataclass(frozen=True, slots=True)
class ResolvedSource:
    """Canonical source identity returned by a resolver."""

    source_id: UUID
    provider: str
    source_type: str
    external_id: str
    owner_id: int
    access_scope_id: UUID | None = None
    source_revision: int = 0
    access_scope_revision: int = 0


class SourceResolver(Protocol):
    """Resolves normalized identities to canonical source values."""

    async def resolve(self, identity: SourceIdentity) -> ResolvedSource:
        """Return canonical values or raise SourceNotFoundError."""
        ...


class InternalVkSourceResolver:
    """Temporary deterministic VK resolver used until the P2 service callout.

    It performs strict structural validation and derives a stable source UUID
    from the complete global identity. The later vk-service implementation
    must preserve this contract and may additionally verify existence/access.
    """

    async def resolve(self, identity: SourceIdentity) -> ResolvedSource:
        logger.debug("Resolving source identity: %s", identity)
        identity.validate()
        external_id = canonical_external_id(identity.external_id)
        return ResolvedSource(
            source_id=canonical_source_id(identity.provider, identity.source_type, external_id),
            provider=identity.provider,
            source_type=identity.source_type,
            external_id=external_id,
            owner_id=-int(external_id),
        )
