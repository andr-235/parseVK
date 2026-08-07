from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import datetime
from uuid import UUID

from app.domain.entities.ingestion_parts import (
    COMMENT_PART,
    POST_PART,
    PREPARED,
    IngestionPart,
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
    source_kind: str
    owner_id: int
    post_id: int
    page_offset: int
    part: IngestionPart

    def __post_init__(self) -> None:
        if not self.worker_id or len(self.worker_id) > 128:
            raise ValueError("worker_id must contain 1..128 characters")
        if self.lease_expires_at.tzinfo is None:
            raise ValueError("lease_expires_at must be timezone-aware")
        if self.attempts < 1:
            raise ValueError("publication claim attempts must be positive")
        if self.post_id == 0:
            raise ValueError("post_id must be nonzero")
        if self.page_offset < 0:
            raise ValueError("page_offset must be non-negative")
        if self.part.status != PREPARED:
            raise ValueError("only prepared ingestion parts can be claimed")
        expected_source = _SOURCE_KINDS.get(self.part.part_kind)
        if expected_source is None:
            raise ValueError("unsupported ingestion part kind")
        if self.source_kind != expected_source:
            raise ValueError("part kind conflicts with staged source kind")
        self.part.verified_copy()

    @property
    def event_id(self) -> UUID:
        return self.part.message_id

    @property
    def event_type(self) -> str:
        return _EVENT_TYPES[self.part.part_kind]

    @property
    def kafka_key(self) -> str:
        return f"{self.owner_id}:{self.post_id}"

    def verified_copy(self) -> IngestionPartPublicationClaim:
        self.__post_init__()
        return replace(self, part=self.part.verified_copy())
