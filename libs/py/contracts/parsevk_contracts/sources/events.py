"""Source access event contracts."""

from __future__ import annotations

from typing import Annotated, Literal, Self
from uuid import UUID

from pydantic import Field, model_validator

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import ContractCatalog, MessageContract, PartitionKeySpec
from parsevk_contracts.vk.commands import NegativeOwnerId, PositiveExternalId


class SourceAccessChange(ContractModel):
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
        if self.owner_id != -int(self.external_id):
            raise ValueError(
                "VK community ownerId must equal negative externalId: "
                f"owner_id={self.owner_id}, external_id={self.external_id}"
            )
        return self

    @model_validator(mode="after")
    def validate_scope_user_separation(self) -> Self:
        if self.created_by_user_id == self.access_scope_id:
            raise ValueError("createdByUserId must differ from accessScopeId")
        return self


class SourceAccessGranted(SourceAccessChange):
    pass


class SourceAccessRevoked(SourceAccessChange):
    pass


SOURCE_ACCESS_GRANTED = MessageContract(
    message_type="sources.access.granted",
    payload_model=SourceAccessGranted,
    topic="parsevk.sources.events",
    producers=frozenset({"tasks-service"}),
    consumers=frozenset({"vk-service"}),
    partition_key=PartitionKeySpec(paths=("payload.sourceId",)),
)

SOURCE_ACCESS_REVOKED = MessageContract(
    message_type="sources.access.revoked",
    payload_model=SourceAccessRevoked,
    topic="parsevk.sources.events",
    producers=frozenset({"tasks-service"}),
    consumers=frozenset({"vk-service"}),
    partition_key=PartitionKeySpec(paths=("payload.sourceId",)),
)

CATALOG = ContractCatalog.from_contracts(
    (SOURCE_ACCESS_GRANTED, SOURCE_ACCESS_REVOKED)
)
