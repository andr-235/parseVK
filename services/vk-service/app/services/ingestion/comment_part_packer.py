from datetime import datetime
from typing import Any

from app.domain.entities.ingestion_part_identity import (
    APPLICATION_HARD_LIMIT_BYTES,
    COMMENT_PART,
    PACKING_TARGET_BYTES,
    IngestionPartVersions,
)
from app.domain.entities.ingestion_parts import IngestionPart
from app.services.ingestion.part_authors import (
    author_records,
    comment_item_manifest,
    referenced_author_ids,
)
from app.services.ingestion.part_errors import OversizedIngestionItemError
from app.services.ingestion.part_wire import (
    build_ingestion_part,
    serialize_ingestion_part_wire,
)


def prepare_comment_parts(
    *,
    batch_id,
    source: dict[str, Any],
    post: dict[str, Any],
    comments: list[dict[str, Any]],
    profiles: list[dict[str, Any]],
    groups: list[dict[str, Any]],
    versions: IngestionPartVersions,
    prepared_at: datetime,
) -> tuple[IngestionPart, ...]:
    if not comments:
        raise ValueError("comment page must contain at least one comment")
    packed = _pack_groups(
        batch_id=batch_id,
        source=source,
        post=post,
        comments=comments,
        profiles=profiles,
        groups=groups,
        versions=versions,
        prepared_at=prepared_at,
    )
    part_count = len(packed)
    parts = []
    for part_index, part_comments in enumerate(packed):
        author_ids = referenced_author_ids(post, part_comments)
        authors = author_records(author_ids, profiles=profiles, groups=groups)
        wire_bytes = serialize_ingestion_part_wire(
            batch_id=batch_id,
            source=source,
            part_kind=COMMENT_PART,
            part_index=part_index,
            part_count=part_count,
            versions=versions,
            prepared_at=prepared_at,
            post=post,
            comments=part_comments,
            authors=authors,
        )
        if len(wire_bytes) > APPLICATION_HARD_LIMIT_BYTES:
            identity = comment_item_manifest(part_comments)[0]
            raise OversizedIngestionItemError(
                batch_id=batch_id,
                item_kind="comment",
                item_identity=identity,
                wire_bytes_count=len(wire_bytes),
                hard_limit_bytes=APPLICATION_HARD_LIMIT_BYTES,
            )
        parts.append(
            build_ingestion_part(
                batch_id=batch_id,
                source=source,
                part_kind=COMMENT_PART,
                part_index=part_index,
                part_count=part_count,
                versions=versions,
                prepared_at=prepared_at,
                post=post,
                comments=part_comments,
                authors=authors,
                item_manifest=comment_item_manifest(part_comments),
                author_manifest=author_ids,
            )
        )
    return tuple(parts)


def _pack_groups(
    *,
    batch_id,
    source: dict[str, Any],
    post: dict[str, Any],
    comments: list[dict[str, Any]],
    profiles: list[dict[str, Any]],
    groups: list[dict[str, Any]],
    versions: IngestionPartVersions,
    prepared_at: datetime,
) -> list[list[dict[str, Any]]]:
    maximum_count = len(comments)
    packed: list[list[dict[str, Any]]] = []
    current: list[dict[str, Any]] = []
    for comment in comments:
        candidate = [*current, comment]
        author_ids = referenced_author_ids(post, candidate)
        authors = author_records(author_ids, profiles=profiles, groups=groups)
        candidate_bytes = serialize_ingestion_part_wire(
            batch_id=batch_id,
            source=source,
            part_kind=COMMENT_PART,
            part_index=maximum_count - 1,
            part_count=maximum_count,
            versions=versions,
            prepared_at=prepared_at,
            post=post,
            comments=candidate,
            authors=authors,
        )
        if current and len(candidate_bytes) > PACKING_TARGET_BYTES:
            packed.append(current)
            current = [comment]
        else:
            current = candidate
    packed.append(current)
    return packed
