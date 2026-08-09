"""Canonical content change contracts consumed by downstream projections."""

from __future__ import annotations

from typing import Annotated, Literal, Self
from uuid import UUID

from pydantic import AwareDatetime, Field, model_validator

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import ContractCatalog, MessageContract, PartitionKeySpec

TOPIC = "parsevk.content.events"
CONTENT_CANONICAL_COMMENTS_CHANGED = "content.canonical_comments_changed"


class ContentCanonicalComment(ContractModel):
    owner_id: int
    post_id: int
    comment_id: int
    author_id: int | None = None
    text: str | None = None
    created_at: AwareDatetime | None = None


class ContentCanonicalCommentsChanged(ContractModel):
    source_service: Literal["content-service"]
    source_message_id: UUID
    batch_id: UUID
    post_key: str = Field(min_length=3)
    post_revision: Annotated[int, Field(gt=0)]
    chunk_index: Annotated[int, Field(ge=0)]
    chunk_count: Annotated[int, Field(gt=0)]
    comments: tuple[ContentCanonicalComment, ...]

    @model_validator(mode="after")
    def validate_chunk_bounds(self) -> Self:
        if self.chunk_index >= self.chunk_count:
            raise ValueError("chunkIndex must be smaller than chunkCount")
        return self


CATALOG = ContractCatalog.from_contracts(
    (
        MessageContract(
            message_type=CONTENT_CANONICAL_COMMENTS_CHANGED,
            payload_model=ContentCanonicalCommentsChanged,
            topic=TOPIC,
            producers=frozenset({"content-service"}),
            consumers=frozenset({"moderation-service"}),
            partition_key=PartitionKeySpec(paths=("payload.postKey",)),
        ),
    )
)
