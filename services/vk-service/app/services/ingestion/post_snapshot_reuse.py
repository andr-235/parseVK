from dataclasses import dataclass
from typing import Any

from app.domain.entities.ingestion_staging import (
    StagedIngestionBatch,
    deterministic_batch_id,
)
from app.domain.repositories.ingestion_staging import (
    StagingPayloadConflictError,
    StagingPayloadIntegrityError,
)
from app.infrastructure.metrics.ingestion_staging_metrics import (
    observe_staging_result,
)
from app.services.ingestion.prepared_stager import PreparedPhysicalIngestionStager
from app.services.ingestion.staging_writer import (
    POST_SNAPSHOT,
    STAGING_SCHEMA_VERSION,
    PhysicalIngestionStager,
)


@dataclass(frozen=True, slots=True)
class PostSnapshotResolution:
    post: dict[str, Any]
    authors: tuple[dict[str, Any], ...]
    created: bool


async def stage_or_reuse_post_snapshot(
    staging: PreparedPhysicalIngestionStager | PhysicalIngestionStager,
    *,
    post: dict[str, Any],
    authors: list[dict[str, Any]],
) -> PostSnapshotResolution:
    owner_id = int(post["owner_id"])
    post_id = int(post["id"])
    batch_id = deterministic_batch_id(
        execution_id=staging.execution_id,
        source_kind=POST_SNAPSHOT,
        owner_id=owner_id,
        post_id=post_id,
        page_offset=0,
    )
    existing = await staging.repository.get(batch_id)
    if existing is not None:
        await _prepare_existing(staging, existing)
        return _reuse(existing, owner_id=owner_id, post_id=post_id)

    try:
        batch, created = await staging.stage_post(post=post, authors=authors)
    except StagingPayloadConflictError:
        existing = await staging.repository.get(batch_id)
        if existing is None:
            raise
        await _prepare_existing(staging, existing)
        return _reuse(existing, owner_id=owner_id, post_id=post_id)
    return _resolve(batch, owner_id=owner_id, post_id=post_id, created=created)


async def _prepare_existing(
    staging: PreparedPhysicalIngestionStager | PhysicalIngestionStager,
    batch: StagedIngestionBatch,
) -> None:
    prepare = getattr(staging, "prepare_existing", None)
    if prepare is not None:
        await prepare(batch)


def _reuse(
    batch: StagedIngestionBatch,
    *,
    owner_id: int,
    post_id: int,
) -> PostSnapshotResolution:
    resolved = _resolve(batch, owner_id=owner_id, post_id=post_id, created=False)
    observe_staging_result(POST_SNAPSHOT, "reused")
    return resolved


def _resolve(
    batch: StagedIngestionBatch,
    *,
    owner_id: int,
    post_id: int,
    created: bool,
) -> PostSnapshotResolution:
    if (
        batch.source_kind != POST_SNAPSHOT
        or batch.owner_id != owner_id
        or batch.post_id != post_id
        or batch.page_offset != 0
    ):
        raise StagingPayloadIntegrityError("stored post snapshot has invalid source position")
    payload = batch.payload
    observed = payload.get("observed")
    if payload.get("schemaVersion") != STAGING_SCHEMA_VERSION or not isinstance(
        observed, dict
    ):
        raise StagingPayloadIntegrityError("stored post snapshot has unsupported shape")
    stored_post = observed.get("post")
    stored_authors = observed.get("authors")
    if not isinstance(stored_post, dict) or not isinstance(stored_authors, list):
        raise StagingPayloadIntegrityError("stored post snapshot has invalid observations")
    try:
        identity = int(stored_post["owner_id"]), int(stored_post["id"])
    except (KeyError, TypeError, ValueError) as error:
        raise StagingPayloadIntegrityError(
            "stored post snapshot identity is invalid"
        ) from error
    if identity != (owner_id, post_id):
        raise StagingPayloadIntegrityError("stored post snapshot identity changed")
    return PostSnapshotResolution(
        post=dict(stored_post),
        authors=tuple(_validated_author(author) for author in stored_authors),
        created=created,
    )


def _validated_author(author: object) -> dict[str, Any]:
    if not isinstance(author, dict):
        raise StagingPayloadIntegrityError("stored post snapshot author is not an object")
    author_id = author.get("vk_author_id")
    if type(author_id) is not int or author_id == 0:
        raise StagingPayloadIntegrityError(
            "stored post snapshot author identity is invalid"
        )
    author_type = author.get("type")
    if author_type not in {"user", "group"}:
        raise StagingPayloadIntegrityError(
            "stored post snapshot author type is invalid"
        )
    expected_type = "group" if author_id < 0 else "user"
    if author_type != expected_type:
        raise StagingPayloadIntegrityError(
            "stored post snapshot author type conflicts with identity"
        )
    return dict(author)
