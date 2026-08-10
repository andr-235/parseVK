from __future__ import annotations

from datetime import UTC, datetime

from app.domain.entities.ingestion_ack import IngestionPartAppliedAck
from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch


def ack_mismatch_reason(
    ack: IngestionPartAppliedAck,
    part: VkIngestionStagingPart,
    reference: VkIngestionPartReference,
    batch: VkIngestionStagingBatch,
) -> str | None:
    expected = (
        part.batch_id,
        part.part_kind,
        part.part_index,
        part.part_count,
        part.staging_schema_version,
        part.packing_version,
        part.event_contract_version,
        batch.payload_digest,
        part.part_digest,
        part.wire_digest,
    )
    received = (
        ack.batch_id,
        ack.part_kind,
        ack.part_index,
        ack.part_count,
        ack.versions.staging_schema,
        ack.versions.packing,
        ack.versions.event_contract,
        ack.page_digest,
        ack.part_digest,
        ack.wire_digest,
    )
    if expected != received:
        return "ACK identity, versions or digests do not match staged evidence"
    expected_source = _source_position(batch, reference)
    if expected_source != ack.source_position:
        return "ACK source position does not match staged evidence"
    return None


def is_exact_replay(
    ack: IngestionPartAppliedAck,
    reference: VkIngestionPartReference,
) -> bool:
    return (
        reference.ack_event_id == ack.ack_event_id
        and reference.ack_receipt_id == ack.receipt_id
        and _same_time(reference.ack_applied_at, ack.applied_at)
        and reference.ack_source_position == ack.source_position
        and reference.ack_effect_summary == ack.effect_summary
    )


def _source_position(
    batch: VkIngestionStagingBatch,
    reference: VkIngestionPartReference,
) -> dict | None:
    if batch.payload is not None:
        source = batch.payload.get("source")
        return dict(source) if isinstance(source, dict) else None
    return reference.ack_source_position


def _same_time(left: datetime | None, right: datetime) -> bool:
    if left is None:
        return False
    return _as_utc(left) == _as_utc(right)


def _as_utc(value: datetime) -> datetime:
    return value.astimezone(UTC) if value.tzinfo else value.replace(tzinfo=UTC)
