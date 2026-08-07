from datetime import datetime
from typing import Any
from uuid import UUID

from common.events import WireEvent

from app.domain.entities.ingestion_part_identity import (
    COMMENT_PART,
    POST_PART,
    IngestionPartVersions,
    deterministic_part_id,
)
from app.domain.entities.ingestion_parts import IngestionPart

_EVENT_TYPES = {
    POST_PART: "vk.content_ingestion.post_part",
    COMMENT_PART: "vk.content_ingestion.comment_part",
}


def serialize_ingestion_part_wire(
    *,
    batch_id: UUID,
    source: dict[str, Any],
    part_kind: str,
    part_index: int,
    part_count: int,
    versions: IngestionPartVersions,
    prepared_at: datetime,
    post: dict[str, Any],
    comments: list[dict[str, Any]],
    authors: list[dict[str, Any]],
) -> bytes:
    message_id = deterministic_part_id(
        batch_id=batch_id,
        part_kind=part_kind,
        versions=versions,
        part_index=part_index,
    )
    wire = WireEvent(
        event_id=message_id,
        event_type=_EVENT_TYPES[part_kind],
        event_version=versions.event_contract,
        aggregate_type="vk_ingestion_batch",
        aggregate_id=str(batch_id),
        payload={
            "batchId": str(batch_id),
            "partId": str(message_id),
            "partKind": part_kind,
            "partIndex": part_index,
            "partCount": part_count,
            "versions": {
                "stagingSchema": versions.staging_schema,
                "packing": versions.packing,
                "eventContract": versions.event_contract,
            },
            "source": dict(source),
            "post": dict(post),
            "comments": [dict(comment) for comment in comments],
            "authors": [dict(author) for author in authors],
        },
        created_at=prepared_at.isoformat(),
    )
    return wire.model_dump_json().encode("utf-8")


def build_ingestion_part(
    *,
    batch_id: UUID,
    source: dict[str, Any],
    part_kind: str,
    part_index: int,
    part_count: int,
    versions: IngestionPartVersions,
    prepared_at: datetime,
    post: dict[str, Any],
    comments: list[dict[str, Any]],
    authors: list[dict[str, Any]],
    item_manifest: tuple[str, ...],
    author_manifest: tuple[int, ...],
) -> IngestionPart:
    wire_bytes = serialize_ingestion_part_wire(
        batch_id=batch_id,
        source=source,
        part_kind=part_kind,
        part_index=part_index,
        part_count=part_count,
        versions=versions,
        prepared_at=prepared_at,
        post=post,
        comments=comments,
        authors=authors,
    )
    return IngestionPart.create(
        batch_id=batch_id,
        part_kind=part_kind,
        part_index=part_index,
        part_count=part_count,
        versions=versions,
        item_manifest=item_manifest,
        author_manifest=author_manifest,
        prepared_at=prepared_at,
        wire_bytes=wire_bytes,
    )
