from __future__ import annotations

from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch


class PurgeEvidenceError(RuntimeError):
    pass


def build_purge_manifest(
    batch: VkIngestionStagingBatch,
    rows: list[tuple[VkIngestionStagingPart, VkIngestionPartReference]],
) -> dict:
    if batch.status != "applied" or batch.applied_at is None or batch.payload is None:
        raise PurgeEvidenceError("batch is not an applied retained payload")
    if not rows:
        raise PurgeEvidenceError("applied batch has no staged parts")
    _validate_part_sets(rows)
    parts = []
    for part, reference in rows:
        if part.status != "applied" or part.applied_at is None or part.wire_bytes is None:
            raise PurgeEvidenceError("part is not fully applied before purge")
        if reference.status != "applied" or not _has_ack_evidence(reference):
            raise PurgeEvidenceError("part lacks durable ACK evidence before purge")
        parts.append(
            {
                "messageId": str(part.id),
                "partKind": part.part_kind,
                "partIndex": part.part_index,
                "partCount": part.part_count,
                "versions": {
                    "stagingSchema": part.staging_schema_version,
                    "packing": part.packing_version,
                    "eventContract": part.event_contract_version,
                },
                "partDigest": part.part_digest,
                "wireDigest": part.wire_digest,
                "receiptId": str(reference.ack_receipt_id),
                "ackEventId": str(reference.ack_event_id),
            }
        )
    return {
        "schemaVersion": 1,
        "batchId": str(batch.id),
        "executionId": str(batch.execution_id),
        "source": {
            "kind": batch.source_kind,
            "ownerId": batch.owner_id,
            "postId": batch.post_id,
            "pageOffset": batch.page_offset,
        },
        "pageDigest": batch.payload_digest,
        "parts": parts,
    }


def _has_ack_evidence(reference: VkIngestionPartReference) -> bool:
    return all(
        value is not None
        for value in (
            reference.ack_event_id,
            reference.ack_receipt_id,
            reference.ack_applied_at,
            reference.ack_received_at,
            reference.ack_source_position,
            reference.ack_effect_summary,
        )
    )


def _validate_part_sets(
    rows: list[tuple[VkIngestionStagingPart, VkIngestionPartReference]],
) -> None:
    by_kind: dict[str, list[VkIngestionStagingPart]] = {}
    for part, _reference in rows:
        by_kind.setdefault(part.part_kind, []).append(part)
    for kind, parts in by_kind.items():
        counts = {part.part_count for part in parts}
        indexes = {part.part_index for part in parts}
        if len(counts) != 1:
            raise PurgeEvidenceError(f"inconsistent {kind} part_count")
        expected = next(iter(counts))
        if len(parts) != expected or indexes != set(range(expected)):
            raise PurgeEvidenceError(f"incomplete {kind} part manifest")
