from dataclasses import dataclass
from datetime import datetime
from typing import Any

from app.domain.entities.ingestion_part_identity import (
    APPLICATION_HARD_LIMIT_BYTES,
    POST_PART,
    IngestionPartVersions,
)
from app.domain.entities.ingestion_parts import (
    IngestionPart,
    IngestionPartReference,
)
from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.services.ingestion.comment_part_packer import prepare_comment_parts
from app.services.ingestion.part_authors import (
    PartSourceIntegrityError,
    normalized_staged_authors,
)
from app.services.ingestion.part_errors import OversizedIngestionItemError
from app.services.ingestion.part_source_validation import (
    mapping,
    mapping_list,
    validate_staged_position,
)
from app.services.ingestion.part_wire import (
    build_ingestion_part,
    serialize_ingestion_part_wire,
)
from app.services.ingestion.staging_writer import (
    COMMENT_PAGE,
    POST_SNAPSHOT,
    STAGING_SCHEMA_VERSION,
)


@dataclass(frozen=True, slots=True)
class PreparedIngestionParts:
    parts: tuple[IngestionPart, ...]
    references: tuple[IngestionPartReference, ...]


def prepare_staged_batch(
    batch: StagedIngestionBatch,
    *,
    versions: IngestionPartVersions,
    prepared_at: datetime,
) -> PreparedIngestionParts:
    payload = batch.payload
    if payload.get("schemaVersion") != versions.staging_schema:
        raise PartSourceIntegrityError("unsupported staged ingestion schema")
    if versions.staging_schema != STAGING_SCHEMA_VERSION:
        raise PartSourceIntegrityError("part preparer does not support staged schema")
    source = mapping(payload.get("source"), "staged source")
    source["providerMetadata"] = mapping(
        payload.get("providerMetadata"),
        "staged provider metadata",
    )
    observed = mapping(payload.get("observed"), "staged observations")
    validate_staged_position(batch, source, observed)

    if batch.source_kind == POST_SNAPSHOT:
        parts = (_prepare_post_part(batch, source, observed, versions, prepared_at),)
    elif batch.source_kind == COMMENT_PAGE:
        parts = _prepare_comment_page(batch, source, observed, versions, prepared_at)
    else:
        raise PartSourceIntegrityError(
            f"unsupported staged source kind: {batch.source_kind}"
        )
    references = tuple(
        IngestionPartReference(part_id=part.message_id) for part in parts
    )
    return PreparedIngestionParts(parts=parts, references=references)


def _prepare_post_part(
    batch: StagedIngestionBatch,
    source: dict[str, Any],
    observed: dict[str, Any],
    versions: IngestionPartVersions,
    prepared_at: datetime,
) -> IngestionPart:
    post = mapping(observed.get("post"), "staged post")
    authors_value = observed.get("authors")
    if not isinstance(authors_value, list):
        raise PartSourceIntegrityError("staged post authors must be a list")
    authors = normalized_staged_authors(authors_value)
    author_ids = tuple(author["vkAuthorId"] for author in authors)
    post_identity = f"post:{batch.owner_id}:{batch.post_id}"
    wire_bytes = serialize_ingestion_part_wire(
        batch_id=batch.batch_id,
        source=source,
        part_kind=POST_PART,
        part_index=0,
        part_count=1,
        versions=versions,
        prepared_at=prepared_at,
        post=post,
        comments=[],
        authors=authors,
    )
    if len(wire_bytes) > APPLICATION_HARD_LIMIT_BYTES:
        raise OversizedIngestionItemError(
            batch_id=batch.batch_id,
            item_kind="post",
            item_identity=post_identity,
            wire_bytes_count=len(wire_bytes),
            hard_limit_bytes=APPLICATION_HARD_LIMIT_BYTES,
            versions=versions,
        )
    return build_ingestion_part(
        batch_id=batch.batch_id,
        source=source,
        part_kind=POST_PART,
        part_index=0,
        part_count=1,
        versions=versions,
        prepared_at=prepared_at,
        post=post,
        comments=[],
        authors=authors,
        item_manifest=(post_identity,),
        author_manifest=author_ids,
    )


def _prepare_comment_page(
    batch: StagedIngestionBatch,
    source: dict[str, Any],
    observed: dict[str, Any],
    versions: IngestionPartVersions,
    prepared_at: datetime,
) -> tuple[IngestionPart, ...]:
    post = mapping(observed.get("post"), "staged comment-page post")
    comments = mapping_list(observed.get("comments"), "staged comments")
    profiles = mapping_list(observed.get("profiles"), "staged profiles")
    groups = mapping_list(observed.get("groups"), "staged groups")
    return prepare_comment_parts(
        batch_id=batch.batch_id,
        source=source,
        post=post,
        comments=comments,
        profiles=profiles,
        groups=groups,
        versions=versions,
        prepared_at=prepared_at,
    )
