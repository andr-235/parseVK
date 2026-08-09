from __future__ import annotations

from uuid import UUID

from app.db.models import ContentOutboxEvent
from app.modules.ingestion.models import ContentIngestionReceipt
from app.modules.ingestion.receipt_repository import ack_event_id

ACK_EVENT_TYPE = "content.ingestion.part-applied"


class IngestionCorruptionError(RuntimeError):
    """Durable state exists in an impossible receipt/marker/ACK combination."""


class IngestionIdentityCollision(IngestionCorruptionError):
    """The deterministic ingress identity was reused with different content."""


def ack_id_for(source_message_id: UUID) -> UUID:
    return ack_event_id(source_message_id)


def ack_payload(receipt: ContentIngestionReceipt) -> dict:
    if receipt.applied_at is None:
        raise IngestionCorruptionError("cannot build ACK for unapplied receipt")
    return {
        "sourceService": receipt.source_service,
        "sourceMessageId": str(receipt.source_message_id),
        "batchId": str(receipt.batch_id),
        "partKind": receipt.part_kind,
        "partIndex": receipt.part_index,
        "partCount": receipt.part_count,
        "versions": {
            "stagingSchema": receipt.staging_schema,
            "packing": receipt.packing_version,
            "eventContract": receipt.event_contract,
        },
        "sourcePosition": receipt.source_position,
        "pageDigest": receipt.page_digest,
        "partDigest": receipt.part_digest,
        "wireDigest": receipt.wire_digest,
        "receiptId": str(receipt.id),
        "appliedAt": receipt.applied_at.isoformat(),
        "effectSummary": receipt.effect_summary,
    }


def verify_ack(existing: ContentOutboxEvent, payload: dict) -> None:
    if existing.event_type != ACK_EVENT_TYPE or existing.payload != payload:
        raise IngestionCorruptionError("ACK outbox conflicts with ingestion receipt")
