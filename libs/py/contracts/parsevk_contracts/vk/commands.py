"""VK domain command contracts."""

from __future__ import annotations

from typing import Annotated, Literal, Self
from uuid import UUID

from pydantic import Field, StringConstraints, model_validator

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import ContractCatalog, MessageContract, PartitionKeySpec

# ── Type aliases ──────────────────────────────────────────────────────────────

Sha256Hex = Annotated[str, StringConstraints(pattern=r"^[0-9a-f]{64}$")]
NegativeOwnerId = Annotated[int, Field(lt=0)]
PositiveExternalId = Annotated[str, StringConstraints(pattern=r"^[1-9][0-9]*$")]

# ── Models ────────────────────────────────────────────────────────────────────


class SourceReference(ContractModel):
    """Reference to a VK community source."""

    source_id: UUID
    provider: Literal["vk"]
    source_type: Literal["community"]
    external_id: PositiveExternalId
    owner_id: NegativeOwnerId

    @model_validator(mode="after")
    def validate_vk_identity(self) -> Self:
        """VK community ownerId must equal negative externalId."""
        if self.owner_id != -int(self.external_id):
            raise ValueError(
                "VK community ownerId must equal negative externalId: "
                f"owner_id={self.owner_id}, external_id={self.external_id}"
            )
        return self


class VkSourceDemandRequest(ContractModel):
    """A single source collection demand within an execution request."""

    demand_id: UUID
    source: SourceReference


class PostSelection(ContractModel):
    """Post collection strategy."""

    strategy: Literal["latestByPublishedAt"]
    limit_per_source: Annotated[int, Field(ge=1, le=100)]


class CommentSelection(ContractModel):
    """Comment collection strategy."""

    mode: Literal["all"]
    include_thread_replies: Literal[True]


class VkExecutionRequested(ContractModel):
    """Command payload: request VK execution for one or more sources."""

    task_id: Annotated[int, Field(gt=0)]
    task_run_id: UUID
    execution_id: UUID
    demands: Annotated[tuple[VkSourceDemandRequest, ...], Field(min_length=1)]
    post_selection: PostSelection
    comment_selection: CommentSelection
    task_revision: Annotated[int, Field(ge=0)]
    source_set_revision: Annotated[int, Field(ge=0)]
    snapshot_sha256: Sha256Hex

    @model_validator(mode="after")
    def validate_unique_demand_ids(self) -> Self:
        """All demand_ids must be unique within a single request."""
        demand_ids = [d.demand_id for d in self.demands]
        if len(demand_ids) != len(set(demand_ids)):
            raise ValueError("Duplicate demand_id found in demands")
        return self

    @model_validator(mode="after")
    def validate_unique_source_ids(self) -> Self:
        """All source_ids must be unique within a single request."""
        source_ids = [d.source.source_id for d in self.demands]
        if len(source_ids) != len(set(source_ids)):
            raise ValueError("Duplicate source_id found in demands")
        return self


# ── Contract definition ───────────────────────────────────────────────────────


VK_EXECUTION_REQUESTED = MessageContract(
    message_type="vk.execution.requested",
    schema_version=1,
    payload_model=VkExecutionRequested,
    topic="parsevk.vk.commands",
    producers=frozenset({"tasks-service"}),
    consumers=frozenset({"vk-service"}),
    partition_key=PartitionKeySpec(paths=("payload.executionId",)),
    correlation_required=True,
    causation_policy="forbidden",
    compatibility="backward",
)

CATALOG = ContractCatalog.from_contracts((VK_EXECUTION_REQUESTED,))
