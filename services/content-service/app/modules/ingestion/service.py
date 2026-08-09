from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from app.modules.ingestion.ack import (
    ACK_EVENT_TYPE,
    IngestionCorruptionError,
    IngestionIdentityCollision,
    ack_id_for,
    ack_payload,
    verify_ack,
)
from app.modules.ingestion.canonical_events import (
    CANONICAL_COMMENTS_EVENT_TYPE,
    MANIFEST_KEY,
    build_canonical_moderation_manifest,
)
from app.modules.ingestion.canonical_repository import CanonicalIngestionRepository
from app.modules.ingestion.contract import IngestionPartEnvelope
from app.modules.ingestion.models import ContentIngestionReceipt
from app.modules.ingestion.receipt_repository import IngestionReceiptRepository
from app.modules.projections.outbox_service import ContentOutboxService

__all__ = [
    "ACK_EVENT_TYPE",
    "IngestionApplicationService",
    "IngestionCorruptionError",
    "IngestionIdentityCollision",
]


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
            effects = await self.canonical.apply(part)
            receipt.applied_at = datetime.now(UTC)
            receipt.effect_summary = {
                **effects,
                MANIFEST_KEY: build_canonical_moderation_manifest(
                    part, created_at=receipt.applied_at
                ),
            }
        else:
            self._verify_receipt(receipt, part)
            if receipt.applied_at is None:
                raise IngestionCorruptionError("committed receipt is not marked applied")
            # Receipts created during the previous P3 step have no moderation manifest yet.
            # The immutable replayed part is enough to backfill it without reapplying canonical state.
            if MANIFEST_KEY not in receipt.effect_summary:
                receipt.effect_summary = {
                    **receipt.effect_summary,
                    MANIFEST_KEY: build_canonical_moderation_manifest(
                        part, created_at=receipt.applied_at
                    ),
                }
        await self._ensure_canonical_events(receipt)
        await self.receipts.ensure_processed(part.source_message_id, part.event.event_type)
        await self._ensure_ack(receipt, part.event.correlation_id)
        await self.receipts.flush()
        return receipt

    async def _assert_no_orphans(self, part: IngestionPartEnvelope) -> None:
        if await self.receipts.has_processed(part.source_message_id):
            raise IngestionCorruptionError("processed marker exists without ingestion receipt")
        if await self.receipts.get_ack(ack_id_for(part.source_message_id)) is not None:
            raise IngestionCorruptionError("ACK outbox exists without ingestion receipt")

    async def _ensure_canonical_events(self, receipt: ContentIngestionReceipt) -> None:
        manifest = receipt.effect_summary.get(MANIFEST_KEY)
        if not isinstance(manifest, dict) or manifest.get("contractVersion") != 1:
            raise IngestionCorruptionError("canonical moderation manifest is invalid")
        events = manifest.get("events")
        if not isinstance(events, list):
            raise IngestionCorruptionError("canonical moderation manifest events are invalid")
        for item in events:
            event_id = UUID(item["eventId"])
            existing = await self.receipts.get_outbox(event_id)
            if existing is not None:
                expected = (
                    CANONICAL_COMMENTS_EVENT_TYPE,
                    manifest["contractVersion"],
                    item["aggregateType"],
                    item["aggregateId"],
                    item.get("correlationId"),
                    item["dedupeKey"],
                    item["payload"],
                    datetime.fromisoformat(item["createdAt"]),
                )
                actual = (
                    existing.event_type,
                    existing.event_version,
                    existing.aggregate_type,
                    existing.aggregate_id,
                    existing.correlation_id,
                    existing.dedupe_key,
                    existing.payload,
                    existing.created_at,
                )
                if actual != expected:
                    raise IngestionCorruptionError("canonical moderation outbox differs from manifest")
                continue
            await self.outbox.add_event(
                event_id=event_id,
                event_type=CANONICAL_COMMENTS_EVENT_TYPE,
                event_version=manifest["contractVersion"],
                aggregate_type=item["aggregateType"],
                aggregate_id=item["aggregateId"],
                correlation_id=item.get("correlationId"),
                dedupe_key=item["dedupeKey"],
                payload=item["payload"],
                created_at=datetime.fromisoformat(item["createdAt"]),
            )

    async def _ensure_ack(
        self, receipt: ContentIngestionReceipt, correlation_id: str | None
    ) -> None:
        payload = ack_payload(receipt)
        existing = await self.receipts.get_ack(receipt.ack_event_id)
        if existing is not None:
            verify_ack(existing, payload)
            return
        await self.outbox.add_event(
            event_id=receipt.ack_event_id,
            event_type=ACK_EVENT_TYPE,
            aggregate_type="vk_ingestion_part",
            aggregate_id=str(receipt.source_message_id),
            correlation_id=correlation_id,
            dedupe_key=f"ingestion-ack:{receipt.source_message_id}",
            payload=payload,
        )

    @staticmethod
    def _verify_receipt(receipt: ContentIngestionReceipt, part: IngestionPartEnvelope) -> None:
        expected = (
            part.source_service, part.source_message_id, part.batch_id, part.part_kind,
            part.part_index, part.part_count, part.versions.staging_schema,
            part.versions.packing, part.versions.event_contract, part.source,
            part.page_digest, part.part_digest, part.wire_digest, part.wire_bytes,
        )
        actual = (
            receipt.source_service, receipt.source_message_id, receipt.batch_id,
            receipt.part_kind, receipt.part_index, receipt.part_count, receipt.staging_schema,
            receipt.packing_version, receipt.event_contract, receipt.source_position,
            receipt.page_digest, receipt.part_digest, receipt.wire_digest, receipt.wire_bytes,
        )
        if actual != expected:
            raise IngestionIdentityCollision("receipt identity has different immutable content")
