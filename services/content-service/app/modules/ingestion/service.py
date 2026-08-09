from __future__ import annotations

from datetime import UTC, datetime

from app.modules.ingestion.ack import (
    ACK_EVENT_TYPE,
    IngestionCorruptionError,
    IngestionIdentityCollision,
    ack_id_for,
)
from app.modules.ingestion.ack_outbox import ensure_ack_outbox
from app.modules.ingestion.canonical_events import (
    MANIFEST_KEY,
    build_canonical_moderation_manifest,
)
from app.modules.ingestion.canonical_outbox import CanonicalModerationOutboxManager
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
        self.canonical_outbox = CanonicalModerationOutboxManager(receipts, outbox)

    async def apply(self, part: IngestionPartEnvelope) -> ContentIngestionReceipt:
        receipt = await self.receipts.load(part)
        if receipt is None:
            await self._assert_no_orphans(part)
            receipt = await self.receipts.create(part)
            effects = await self.canonical.apply(part)
            post_revision = int(effects.get("postRevision", 0))
            if post_revision <= 0:
                raise IngestionCorruptionError(
                    "canonical mutation did not return a positive post revision"
                )
            receipt.applied_at = datetime.now(UTC)
            receipt.effect_summary = {
                **effects,
                MANIFEST_KEY: build_canonical_moderation_manifest(
                    part,
                    created_at=receipt.applied_at,
                    post_revision=post_revision,
                ),
            }
        else:
            self._verify_receipt(receipt, part)
            if receipt.applied_at is None:
                raise IngestionCorruptionError("committed receipt is not marked applied")

        if MANIFEST_KEY in receipt.effect_summary:
            await self.canonical_outbox.ensure(receipt)
        await self.receipts.ensure_processed(part.source_message_id, part.event.event_type)
        await ensure_ack_outbox(
            self.receipts,
            self.outbox,
            receipt,
            correlation_id=part.event.correlation_id,
        )
        await self.receipts.flush()
        return receipt

    async def _assert_no_orphans(self, part: IngestionPartEnvelope) -> None:
        if await self.receipts.has_processed(part.source_message_id):
            raise IngestionCorruptionError("processed marker exists without ingestion receipt")
        if await self.receipts.get_ack(ack_id_for(part.source_message_id)) is not None:
            raise IngestionCorruptionError("ACK outbox exists without ingestion receipt")
        canonical_prefix = f"canonical-comments:{part.source_message_id}:"
        if await self.receipts.has_outbox_dedupe_prefix(canonical_prefix):
            raise IngestionCorruptionError(
                "canonical moderation outbox exists without ingestion receipt"
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
