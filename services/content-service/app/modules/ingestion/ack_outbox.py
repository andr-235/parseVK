from __future__ import annotations

from app.modules.ingestion.ack import (
    ACK_EVENT_TYPE,
    IngestionCorruptionError,
    ack_payload,
    verify_ack,
)
from app.modules.ingestion.models import ContentIngestionReceipt
from app.modules.ingestion.receipt_repository import IngestionReceiptRepository
from app.modules.projections.outbox_service import ContentOutboxService


def ack_dedupe_key(receipt: ContentIngestionReceipt) -> str:
    return f"ingestion-ack:{receipt.source_message_id}"


async def ensure_ack_outbox(
    receipts: IngestionReceiptRepository,
    outbox: ContentOutboxService,
    receipt: ContentIngestionReceipt,
    *,
    correlation_id: str | None = None,
) -> dict:
    payload = ack_payload(receipt)
    dedupe_key = ack_dedupe_key(receipt)
    existing = await receipts.get_ack(receipt.ack_event_id)
    if existing is None:
        existing = await receipts.get_outbox_by_dedupe_key(dedupe_key)
    if existing is not None:
        _verify_ack_identity(existing, receipt, payload, dedupe_key)
        return payload

    await outbox.add_event(
        event_id=receipt.ack_event_id,
        event_type=ACK_EVENT_TYPE,
        event_version=1,
        aggregate_type="vk_ingestion_part",
        aggregate_id=str(receipt.source_message_id),
        correlation_id=correlation_id,
        dedupe_key=dedupe_key,
        payload=payload,
    )
    await receipts.flush()
    existing = await receipts.get_ack(receipt.ack_event_id)
    if existing is None:
        existing = await receipts.get_outbox_by_dedupe_key(dedupe_key)
    if existing is None:
        raise IngestionCorruptionError(
            "deterministic ACK outbox was not persisted after regeneration"
        )
    _verify_ack_identity(existing, receipt, payload, dedupe_key)
    return payload


def _verify_ack_identity(existing, receipt, payload: dict, dedupe_key: str) -> None:
    verify_ack(existing, payload)
    expected = (
        receipt.ack_event_id,
        1,
        "vk_ingestion_part",
        str(receipt.source_message_id),
        dedupe_key,
    )
    actual = (
        existing.id,
        existing.event_version,
        existing.aggregate_type,
        existing.aggregate_id,
        existing.dedupe_key,
    )
    if actual != expected:
        raise IngestionCorruptionError(
            "ACK outbox deterministic identity conflicts with ingestion receipt"
        )
