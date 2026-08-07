from dataclasses import replace

from app.domain.entities.ingestion_parts import (
    IngestionPart,
    IngestionPartReference,
)
from app.domain.repositories.ingestion_parts import IngestionPartConflictError


def validate_part_set(
    parts: tuple[IngestionPart, ...],
    references: tuple[IngestionPartReference, ...],
) -> None:
    if not parts:
        raise ValueError("ingestion part set must not be empty")
    batch_ids = {part.batch_id for part in parts}
    expected_count = len(parts)
    indexes = [part.part_index for part in parts]
    if len(batch_ids) != 1:
        raise ValueError("ingestion parts must belong to one batch")
    if any(part.part_count != expected_count for part in parts):
        raise ValueError("part_count must equal the complete prepared set")
    if indexes != list(range(expected_count)):
        raise ValueError("part indexes must be ordered and contiguous")
    part_ids = {part.message_id for part in parts}
    reference_ids = {reference.part_id for reference in references}
    if part_ids != reference_ids or len(references) != expected_count:
        raise ValueError("each ingestion part requires one lightweight reference")


def verify_part_set(
    stored: tuple[IngestionPart, ...],
    expected: tuple[IngestionPart, ...],
) -> None:
    if len(stored) != len(expected):
        raise IngestionPartConflictError(
            "batch already contains an incomplete ingestion part set"
        )
    normalized = tuple(
        replace(part, status=expected_part.status)
        for part, expected_part in zip(stored, expected, strict=True)
    )
    if normalized != expected:
        raise IngestionPartConflictError(
            "batch already contains another immutable ingestion part set"
        )
