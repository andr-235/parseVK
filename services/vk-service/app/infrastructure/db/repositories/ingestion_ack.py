from __future__ import annotations

from datetime import datetime

from sqlalchemy import exists, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.ingestion_ack import IngestionPartAppliedAck
from app.domain.entities.ingestion_parts import APPLIED, PAYLOAD_PURGED, PREPARED, PUBLISHED
from app.domain.entities.ingestion_staging import APPLIED as BATCH_APPLIED
from app.domain.entities.ingestion_staging import PAYLOAD_PURGED as BATCH_PURGED
from app.domain.entities.ingestion_staging import PREPARED as BATCH_PREPARED
from app.domain.entities.ingestion_staging import PUBLISHED as BATCH_PUBLISHED
from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.infrastructure.db.repositories.ingestion_ack_validation import (
    ack_mismatch_reason,
    is_exact_replay,
)


class IngestionAckNotFoundError(RuntimeError):
    pass


class SqlAlchemyIngestionAckRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def apply(
        self,
        ack: IngestionPartAppliedAck,
        *,
        received_at: datetime,
    ) -> str:
        row = (
            await self.session.execute(
                select(
                    VkIngestionStagingPart,
                    VkIngestionPartReference,
                    VkIngestionStagingBatch,
                )
                .join(
                    VkIngestionPartReference,
                    VkIngestionPartReference.part_id == VkIngestionStagingPart.id,
                )
                .join(
                    VkIngestionStagingBatch,
                    VkIngestionStagingBatch.id == VkIngestionStagingPart.batch_id,
                )
                .where(VkIngestionStagingPart.id == ack.source_message_id)
                .with_for_update()
            )
        ).first()
        if row is None:
            raise IngestionAckNotFoundError("ACK references an unknown staged part")
        part, reference, batch = row
        mismatch = ack_mismatch_reason(ack, part, reference, batch)
        if mismatch:
            await self._quarantine(batch.id, mismatch, received_at)
            return "quarantined"

        conflict_batches = await self._conflicting_ack_batches(ack)
        if conflict_batches:
            reason = "ACK event or receipt identity collides with another staged part"
            for batch_id in {batch.id, *conflict_batches}:
                await self._quarantine(batch_id, reason, received_at)
            return "quarantined"

        if reference.status == APPLIED and part.status == APPLIED:
            if is_exact_replay(ack, reference):
                return "replayed"
            await self._quarantine(
                batch.id,
                "conflicting ACK replay for already applied part",
                received_at,
            )
            return "quarantined"
        if batch.status not in {BATCH_PREPARED, BATCH_PUBLISHED}:
            await self._quarantine(
                batch.id,
                "ACK arrived for incompatible batch lifecycle state",
                received_at,
            )
            return "quarantined"
        if reference.status not in {"pending", PUBLISHED} or part.status not in {
            PREPARED,
            PUBLISHED,
        }:
            await self._quarantine(
                batch.id,
                "ACK arrived for incompatible local lifecycle state",
                received_at,
            )
            return "quarantined"

        self._apply_reference(reference, ack, received_at)
        part.status = APPLIED
        part.applied_at = ack.applied_at
        part.updated_at = received_at
        await self.session.flush()
        if await self._mark_batch_applied_if_complete(batch.id, received_at):
            return "batch_applied"
        return "applied"

    @staticmethod
    def _apply_reference(reference, ack, received_at: datetime) -> None:
        reference.status = APPLIED
        reference.claim_id = None
        reference.claimed_by = None
        reference.claim_expires_at = None
        reference.last_error = None
        reference.ack_event_id = ack.ack_event_id
        reference.ack_receipt_id = ack.receipt_id
        reference.ack_applied_at = ack.applied_at
        reference.ack_received_at = received_at
        reference.ack_source_position = dict(ack.source_position)
        reference.ack_effect_summary = dict(ack.effect_summary)
        reference.updated_at = received_at

    async def _conflicting_ack_batches(
        self,
        ack: IngestionPartAppliedAck,
    ) -> tuple:
        rows = await self.session.scalars(
            select(VkIngestionStagingPart.batch_id)
            .join(
                VkIngestionPartReference,
                VkIngestionPartReference.part_id == VkIngestionStagingPart.id,
            )
            .where(
                VkIngestionStagingPart.id != ack.source_message_id,
                or_(
                    VkIngestionPartReference.ack_event_id == ack.ack_event_id,
                    VkIngestionPartReference.ack_receipt_id == ack.receipt_id,
                ),
            )
            .with_for_update()
        )
        return tuple(dict.fromkeys(rows))

    async def _mark_batch_applied_if_complete(
        self,
        batch_id,
        received_at: datetime,
    ) -> bool:
        non_applied_part = exists(
            select(1).where(
                VkIngestionStagingPart.batch_id == batch_id,
                VkIngestionStagingPart.status.notin_([APPLIED, PAYLOAD_PURGED]),
            )
        )
        latest_applied_at = (
            select(func.max(VkIngestionStagingPart.applied_at))
            .where(VkIngestionStagingPart.batch_id == batch_id)
            .scalar_subquery()
        )
        result = await self.session.execute(
            update(VkIngestionStagingBatch)
            .where(
                VkIngestionStagingBatch.id == batch_id,
                VkIngestionStagingBatch.status.in_([BATCH_PREPARED, BATCH_PUBLISHED]),
                ~non_applied_part,
            )
            .values(
                status=BATCH_APPLIED,
                applied_at=latest_applied_at,
                updated_at=received_at,
            )
            .returning(VkIngestionStagingBatch.id)
        )
        return result.scalar_one_or_none() is not None

    async def _quarantine(self, batch_id, reason: str, at: datetime) -> None:
        part_ids = select(VkIngestionStagingPart.id).where(
            VkIngestionStagingPart.batch_id == batch_id
        )
        await self.session.execute(
            update(VkIngestionPartReference)
            .where(VkIngestionPartReference.part_id.in_(part_ids))
            .values(
                status="quarantined",
                claim_id=None,
                claimed_by=None,
                claim_expires_at=None,
                last_error=reason,
                quarantined_at=at,
                updated_at=at,
            )
        )
        await self.session.execute(
            update(VkIngestionStagingPart)
            .where(VkIngestionStagingPart.batch_id == batch_id)
            .values(status="quarantined", updated_at=at)
        )
        await self.session.execute(
            update(VkIngestionStagingBatch)
            .where(
                VkIngestionStagingBatch.id == batch_id,
                VkIngestionStagingBatch.status != BATCH_PURGED,
            )
            .values(status="quarantined", updated_at=at)
        )
