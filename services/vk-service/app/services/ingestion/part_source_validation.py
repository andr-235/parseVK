from typing import Any

from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.services.ingestion.part_authors import PartSourceIntegrityError


def mapping(value: object, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise PartSourceIntegrityError(f"{label} must be an object")
    return dict(value)


def mapping_list(value: object, label: str) -> list[dict[str, Any]]:
    if not isinstance(value, list) or any(not isinstance(item, dict) for item in value):
        raise PartSourceIntegrityError(f"{label} must be a list of objects")
    return [dict(item) for item in value]


def validate_staged_position(
    batch: StagedIngestionBatch,
    source: dict[str, Any],
    observed: dict[str, Any],
) -> None:
    if source.get("kind") != batch.source_kind:
        raise PartSourceIntegrityError("staged source kind conflicts with batch")
    _require_coordinate(source.get("ownerId"), batch.owner_id, "source ownerId")
    _require_coordinate(source.get("postId"), batch.post_id, "source postId")
    _require_coordinate(source.get("pageOffset"), batch.page_offset, "source pageOffset")

    post = mapping(observed.get("post"), "staged post")
    _require_coordinate(post.get("owner_id"), batch.owner_id, "post owner_id")
    _require_coordinate(post.get("id"), batch.post_id, "post id")


def _require_coordinate(value: object, expected: int, label: str) -> None:
    if type(value) is not int or value != expected:
        raise PartSourceIntegrityError(f"staged {label} conflicts with batch")
