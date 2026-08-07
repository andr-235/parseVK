from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import datetime
from uuid import UUID

from app.domain.entities.ingestion_part_identity import COMMENT_PART, POST_PART
from app.domain.entities.ingestion_parts import PREPARED as PART_PREPARED, IngestionPart
from app.domain.entities.ingestion_staging import (
    PREPARED as BATCH_PREPARED,
    StagedIngestionBatch,
)

POST_PART_EVENT = "vk.ingestion.post-part-prepared"
COMMENT_PART_EVENT = "vk.ingestion.comment-part-prepared"
_EVENT_TYPES = {
    POST_PART: POST_PART_EVENT,
    COMMENT_PART: COMMENT_PART_EVENT,
}
_SOURCE_KINDS = {
    POST_PART: "post_snapshot",
    COMMENT_PART: "comment_page",
}


@dataclass(frozen=True, slots=True)
class IngestionPartPublicationClaim:
    claim_id: UUID
    worker_id: str
    lease_expires_at: datetime
    attempts: int
    batch: StagedIngestionBatch
    part: IngestionPart

    def __post_init__(self) -> None:
        if not self.worker_id or len(self.worker_id) > 128:
            raise ValueError("worker_id must contain 1..128 characters")
        if self.lease_expires_at.tzinfo is None:
            raise ValueError("lease_expires_at must be timezone-aware")
        if self.attempts < 1:
            raise ValueError("publication claim attempts must be positive")
        if self.batch.status != BATCH_PREPARED:
            raise ValueError("only prepared staged batches can be claimed")
        if self.part.status != PART_PREPARED:
            raise ValueError("only prepared ingestion parts can be claimed")
        if self.part.batch_id != self.batch.batch_id:
            raise ValueError("claimed part does not belong to staged batch")
        expected_source = _SOURCE_KINDS.get(self.part.part_kind)
        if expected_source is None:
            raise ValueError("unsupported ingestion part kind")
        if self.batch.source_kind != expected_source:
            raise ValueError("part kind conflicts with staged source kind")
        self.batch.verified_copy()
        self.part.verified_copy()

    @property
    def event_id(self) -> UUID:
        return self.part.message_id

    @property
    def event_type(self) -> str:
        return _EVENT_TYPES[self.part.part_kind]

    @property
    def kafka_key(self) -> str:
        return f"{self.batch.owner_id}:{self.batch.post_id}"

    def verified_copy(self) -> IngestionPartPublicationClaim:
        self.__post_init__()
        return replace(
            self,
            batch=self.batch.verified_copy(),
            part=self.part.verified_copy(),
        )
