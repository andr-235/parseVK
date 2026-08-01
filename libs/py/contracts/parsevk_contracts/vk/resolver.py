"""Internal VK source resolver contract.

Data-shape contract for validating frontend-supplied normalized source
identities against canonical sources. The actual resolution is implemented
behind the source resolver port in tasks-service (later phase); this module
defines the request/response shape only.
"""

from __future__ import annotations

from typing import Annotated, Literal
from uuid import UUID

from pydantic import Field

from parsevk_contracts._base import ContractModel
from parsevk_contracts.vk.commands import PositiveExternalId, SourceReference

# ── Models ────────────────────────────────────────────────────────────────────


class VkSourceResolverRequest(ContractModel):
    """Normalized identity used to resolve a canonical source."""

    provider: Literal["vk"]
    source_type: Literal["community"]
    external_id: PositiveExternalId


class VkSourceResolverResponse(ContractModel):
    """Canonical source plus its access scope and revisions.

    Reuses ``SourceReference`` for the identity shape instead of duplicating
    the provider/type/externalId/ownerId fields.
    """

    source: SourceReference
    access_scope_id: UUID
    source_revision: Annotated[int, Field(ge=0)]
    access_scope_revision: Annotated[int, Field(ge=0)]
