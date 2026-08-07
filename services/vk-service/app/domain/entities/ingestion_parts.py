from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import datetime
from hashlib import sha256
from uuid import UUID

from app.domain.entities.ingestion_part_identity import (
    APPLICATION_HARD_LIMIT_BYTES,
    IngestionPartVersions,
    deterministic_part_id,
)
from app.domain.entities.ingestion_staging import canonical_payload

PREPARED = "prepared"
PUBLISHED = "published"
FAILED = "failed"
QUARANTINED = "quarantined"
PENDING = "pending"
PART_STATUSES = frozenset({PREPARED, PUBLISHED, FAILED, QUARANTINED})
REFERENCE_STATUSES = frozenset({PENDING, PUBLISHED, FAILED, QUARANTINED})


@dataclass(frozen=True, slots=True)
class IngestionPart:
    message_id: UUID
    batch_id: UUID
    part_kind: str
    part_index: int
    part_count: int
    versions: IngestionPartVersions
    item_manifest: tuple[str, ...]
    author_manifest: tuple[int, ...]
    prepared_at: datetime
    part_digest: str
    wire_bytes: bytes
    wire_bytes_count: int
    wire_digest: str
    status: str = PREPARED

    @classmethod
    def create(
        cls,
        *,
        batch_id: UUID,
        part_kind: str,
        part_index: int,
        part_count: int,
        versions: IngestionPartVersions,
        item_manifest: tuple[str, ...],
        author_manifest: tuple[int, ...],
        prepared_at: datetime,
        wire_bytes: bytes,
        status: str = PREPARED,
    ) -> IngestionPart:
        if part_count < 1 or not 0 <= part_index < part_count:
            raise ValueError("part_index must identify one part in part_count")
        if prepared_at.tzinfo is None:
            raise ValueError("prepared_at must be timezone-aware")
        if not wire_bytes:
            raise ValueError("wire bytes must not be empty")
        if len(wire_bytes) > APPLICATION_HARD_LIMIT_BYTES:
            raise ValueError("wire bytes exceed the application hard limit")
        if status not in PART_STATUSES:
            raise ValueError("unsupported ingestion part status")
        message_id = deterministic_part_id(
            batch_id=batch_id,
            part_kind=part_kind,
            versions=versions,
            part_index=part_index,
        )
        wire_digest = sha256(wire_bytes).hexdigest()
        manifest = {
            "messageId": str(message_id),
            "batchId": str(batch_id),
            "partKind": part_kind,
            "partIndex": part_index,
            "partCount": part_count,
            "versions": {
                "stagingSchema": versions.staging_schema,
                "packing": versions.packing,
                "eventContract": versions.event_contract,
            },
            "items": list(item_manifest),
            "authors": list(author_manifest),
            "preparedAt": prepared_at.isoformat(),
            "wireDigest": wire_digest,
            "wireBytes": len(wire_bytes),
        }
        _, part_digest, _ = canonical_payload(manifest)
        return cls(
            message_id=message_id,
            batch_id=batch_id,
            part_kind=part_kind,
            part_index=part_index,
            part_count=part_count,
            versions=versions,
            item_manifest=item_manifest,
            author_manifest=author_manifest,
            prepared_at=prepared_at,
            part_digest=part_digest,
            wire_bytes=bytes(wire_bytes),
            wire_bytes_count=len(wire_bytes),
            wire_digest=wire_digest,
            status=status,
        )

    def verified_copy(self) -> IngestionPart:
        recreated = self.create(
            batch_id=self.batch_id,
            part_kind=self.part_kind,
            part_index=self.part_index,
            part_count=self.part_count,
            versions=self.versions,
            item_manifest=self.item_manifest,
            author_manifest=self.author_manifest,
            prepared_at=self.prepared_at,
            wire_bytes=self.wire_bytes,
            status=self.status,
        )
        if recreated != self:
            raise ValueError("ingestion part no longer matches its immutable manifest")
        return replace(self, wire_bytes=bytes(self.wire_bytes))


@dataclass(frozen=True, slots=True)
class IngestionPartReference:
    part_id: UUID
    status: str = PENDING

    def __post_init__(self) -> None:
        if self.status not in REFERENCE_STATUSES:
            raise ValueError("unsupported ingestion part reference status")
