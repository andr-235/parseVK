"""Exact staged VK ingestion part contracts."""

from typing import Any, Literal
from uuid import UUID

from pydantic import Field, model_validator

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import (
    ContractCatalog,
    MessageContract,
    PartitionKeySpec,
)

TOPIC = "parsevk.content.ingestion.vk"
POST_PART_EVENT = "vk.ingestion.post-part-prepared"
COMMENT_PART_EVENT = "vk.ingestion.comment-part-prepared"


class IngestionPartVersionsV1(ContractModel):
    staging_schema: int = Field(ge=1)
    packing: int = Field(ge=1)
    event_contract: int = Field(ge=1)


class IngestionPartSourceV1(ContractModel):
    kind: Literal["post_snapshot", "comment_page"]
    owner_id: int
    post_id: int
    page_offset: int = Field(ge=0)
    next_offset: int | None = Field(default=None, ge=0)
    provider_metadata: dict[str, Any] = Field(default_factory=dict)


class _IngestionPartPayloadV1(ContractModel):
    batch_id: UUID
    part_id: UUID
    part_kind: Literal["post", "comments"]
    part_index: int = Field(ge=0)
    part_count: int = Field(gt=0)
    versions: IngestionPartVersionsV1
    source: IngestionPartSourceV1
    post: dict[str, Any]
    comments: list[dict[str, Any]]
    authors: list[dict[str, Any]]

    @model_validator(mode="after")
    def validate_position_and_source(self) -> "_IngestionPartPayloadV1":
        if self.part_index >= self.part_count:
            raise ValueError("part_index must be below part_count")
        expected_source = (
            "post_snapshot" if self.part_kind == "post" else "comment_page"
        )
        if self.source.kind != expected_source:
            raise ValueError("part kind conflicts with source kind")
        return self


class VkIngestionPostPartPreparedV1(_IngestionPartPayloadV1):
    part_kind: Literal["post"] = "post"

    @model_validator(mode="after")
    def require_post_only_payload(self) -> "VkIngestionPostPartPreparedV1":
        if self.comments:
            raise ValueError("post part comments must be empty")
        return self


class VkIngestionCommentPartPreparedV1(_IngestionPartPayloadV1):
    part_kind: Literal["comments"] = "comments"


_PARTITION_KEY = PartitionKeySpec(
    paths=("payload.source.ownerId", "payload.source.postId"),
)

CATALOG = ContractCatalog.from_contracts(
    (
        MessageContract(
            message_type=POST_PART_EVENT,
            payload_model=VkIngestionPostPartPreparedV1,
            topic=TOPIC,
            producers=frozenset({"vk-service"}),
            consumers=frozenset({"content-service"}),
            partition_key=_PARTITION_KEY,
        ),
        MessageContract(
            message_type=COMMENT_PART_EVENT,
            payload_model=VkIngestionCommentPartPreparedV1,
            topic=TOPIC,
            producers=frozenset({"vk-service"}),
            consumers=frozenset({"content-service"}),
            partition_key=_PARTITION_KEY,
        ),
    )
)
