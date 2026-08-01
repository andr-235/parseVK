"""Source domain event contracts.

Source access change events describe when a source is granted to or
revoked from an access scope. Downstream consumers are declared in the
catalog but NOT enabled until later phases (contracts-only PR).
"""

from __future__ import annotations

from typing import Annotated, Literal, Self
from uuid import UUID

from pydantic import Field, model_validator

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import ContractCatalog, MessageContract, PartitionKeySpec
from parsevk_contracts.vk.commands import NegativeOwnerId, PositiveExternalId

# ── Models ────────────────────────────────────────────────────────────────────


class SourceAccessChange(ContractModel):
    """Base payload for source access change events.

    ``accessScopeId`` and ``createdByUserId`` are SEPARATE fields by design:
    the scope identity must never be conflated with the user who created
    the access.
    """

    source_id: UUID
    provider: Literal["vk"]
    source_type: Literal["community"]
    external_id: PositiveExternalId
    owner_id: NegativeOwnerId
    access_scope_id: UUID
    created_by_user_id: UUID
    revision: Annotated[int, Field(ge=0)]

    @model_validator(mode="after")
    def validate_vk_identity(self) -> Self:
        """VK community ownerId must equal negative externalId."""
        if self.owner_id != -int(self.external_id):
            raise ValueError(
                "VK community ownerId must equal negative externalId: "
                f"owner_id={self.owner_id}, external_id={self.external_id}"
            )
        return self

    @model_validator(mode="after")
    def validate_scope_user_separation(self) -> Self:
        """createdByUserId must not collide with accessScopeId."""
        if self.created_by_user_id == self.access_scope_id:
            raise ValueError(
                "createdByUserId must differ from accessScopeId: "
                f"both are {self.access_scope_id}"
            )
        return self


class SourceAccessGranted(SourceAccessChange):
    """Payload: a source was granted to an access scope."""


class SourceAccessRevoked(SourceAccessChange):
    """Payload: a source was revoked from an access scope (tombstone event)."""


# ── Contract definitions ──────────────────────────────────────────────────────


SOURCE_ACCESS_GRANTED = MessageContract(
    message_type="sources.access.granted",
    schema_version=1,
    payload_model=SourceAccessGranted,
    topic="parsevk.sources.events",
    producers=frozenset({"tasks-service"}),
    # Declared for later phases; consumers are NOT enabled in this PR.
    consumers=frozenset({"vk-service"}),
    partition_key=PartitionKeySpec(paths=("payload.sourceId",)),
    correlation_required=False,
    causation_policy="optional",
    compatibility="backward",
)

SOURCE_ACCESS_REVOKED = MessageContract(
    message_type="sources.access.revoked",
    schema_version=1,
    payload_model=SourceAccessRevoked,
    topic="parsevk.sources.events",
    producers=frozenset({"tasks-service"}),
    # Declared for later phases; consumers are NOT enabled in this PR.
    consumers=frozenset({"vk-service"}),
    partition_key=PartitionKeySpec(paths=("payload.sourceId",)),
    correlation_required=False,
    causation_policy="optional",
    compatibility="backward",
)

CATALOG = ContractCatalog.from_contracts((SOURCE_ACCESS_GRANTED, SOURCE_ACCESS_REVOKED))
