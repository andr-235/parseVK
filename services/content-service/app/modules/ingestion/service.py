from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from app.db.models import ContentOutboxEvent
from app.modules.ingestion.canonical_repository import CanonicalIngestionRepository
from app.modules.ingestion.contract import IngestionPartEnvelope
from app.modules.ingestion.models import ContentIngestionReceipt
from app.modules.ingestion.receipt_repository import IngestionReceiptRepository
from app.modules.projections.outbox_service import ContentOutboxService

ACK_EVENT_TYPE = "content.ingestion.part-applied"


class IngestionCorruptionError(RuntimeError):
    """Durable state exists in an impossible receipt/marker/ACK combination."""


class IngestionIdentityCollision(IngestionCorruptionError):
    """The deterministic ingress identity was reused with different content."""


class IngestionApplicationService:
    def __init__(
        self,
        receipts: IngestionReceiptRepository,
        canonical: CanonicalIngestionRepository,
        outbox: ContentOutboxService,
    ) -> None:
        self.receipts = receipts
        self.canonical = canonical
        self.outbox = outbox

    async def apply(self, part: IngestionPartEnvelope) -> ContentIngestionReceipt:
        receipt = await self.receipts.load(part)
        if receipt is None:
            await self._assert_no_orphans(part)
            receipt = await self.receipts.create(part)
            summary = await self.canonical.apply(part)
            receipt.effect_summary = summary
            receipt.applied_at = datetime.now(UTC)
            await self.receipts.ensure_processed(part.source_message_id, part.event.event_type)
            await self._ensure_ack(receipt, part.event.correlation_id)
            await self.receipts.flush()
            return receipt
        self._verify_receipt(receipt, part)
        if receipt.applied_at is None:
            raise IngestionCorruptionError("committed receipt is not marked applied")
        await self.receipts.ensure_processed(part.source_message_id, part.event.event_type)
        await self._ensure_ack(receipt, part.event.correlation_id)
        await self.receipts.flush()
        return receipt

    async def _assert_no_orphans(self, part: IngestionPartEnvelope) -> None:
        if await self.receipts.has_processed(part.source_message_id):
            raise IngestionCorruptionError("processed marker exists without ingestion receipt")
        expected_ack = _ack_id_for(part)
        if await self.receipts.get_ack(expected_ack) is not None:
            raise IngestionCorruptionError("ACK outbox exists without ingestion receipt")

    async def _ensure_ack(
        self,
        receipt: ContentIngestionReceipt,
        correlation_id: str | None,
    ) -> None:
        expected_payload = ack_payload(receipt)
        existing = await self.receipts.get_ack(receipt.ack_event_id)
        if existing is not None:
            _verify_ack(existing, expected_payload)
            return
        await self.outbox.add_event(
            event_id=receipt.ack_event_id,
            event_type=ACK_EVENT_TYPE,
            aggregate_type="vk_ingestion_part",
            aggregate_id=str(receipt.source_message_id),
            correlation_id=correlation_id,
            dedupe_key=f"ingestion-ack:{receipt.source_message_id}",
            payload=expected_payload,
        )

    @staticmethod
    def _verify_receipt(
        receipt: ContentIngestionReceipt,
        part: IngestionPartEnvelope,
    ) -> None:
        expected = (
            part.source_service,
            part.source_message_id,
            part.batch_id,
            part.part_kind,
            part.part_index,
            part.part_count,
            part.versions.staging_schema,
            part.versions.packing,
            part.versions.event_contract,
            part.source,
            part.page_digest,
            part.part_digest,
            part.wire_digest,
            part.wire_bytes,
        )
        actual = (
            receipt.source_service,
            receipt.source_message_id,
            receipt.batch_id,
            receipt.part_kind,
            receipt.part_index,
            receipt.part_count,
            receipt.staging_schema,
            receipt.packing_version,
            receipt.event_contract,
            receipt.source_position,
            receipt.page_digest,
            receipt.part_digest,
            receipt.wire_digest,
            receipt.wire_bytes,
        )
        if actual != expected:
            raise IngestionIdentityCollision("receipt identity has different immutable content")


def _ack_id_for(part: IngestionPartEnvelope) -> UUID:
    from app.modules.ingestion.receipt_repository import ack_event_id

    return ack_event_id(part.source_message_id)


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


def _verify_ack(existing: ContentOutboxEvent, payload: dict) -> None:
    if existing.event_type != ACK_EVENT_TYPE or existing.payload != payload:
        raise IngestionCorruptionError("ACK outbox conflicts with ingestion receipt")
