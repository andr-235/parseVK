from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.ingestion_parts import IngestionPartReference
from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.infrastructure.db.repositories.ingestion_part_records import part_from_model
from app.infrastructure.db.repositories.ingestion_part_reference_recovery import (
    recover_missing_references,
)
from app.infrastructure.db.repositories.ingestion_part_set_validation import (
    validate_part_set,
)
from app.infrastructure.db.repositories.ingestion_staging import batch_from_model

_AUDITED_BATCH_STATUSES = ("staged", "prepared", "published", "applied")
_PART_REFERENCE_PAIRS = {
    "prepared": "pending",
    "published": "published",
    "applied": "applied",
}


@dataclass(frozen=True, slots=True)
class LocalLifecycleRepairStats:
    missing_references: int = 0
    expired_claims: int = 0
    quarantined_batches: int = 0


async def repair_local_lifecycle(
    session: AsyncSession,
    *,
    now: datetime,
    limit: int,
) -> LocalLifecycleRepairStats:
    missing = await recover_missing_references(session, limit=limit)
    expired = await _release_expired_claims(session, now=now, limit=limit)
    quarantined = await _audit_batches(session, now=now, limit=limit)
    return LocalLifecycleRepairStats(missing, expired, quarantined)


async def _release_expired_claims(
    session: AsyncSession,
    *,
    now: datetime,
    limit: int,
) -> int:
    statement = (
        select(VkIngestionPartReference)
        .join(
            VkIngestionStagingPart,
            VkIngestionStagingPart.id == VkIngestionPartReference.part_id,
        )
        .join(
            VkIngestionStagingBatch,
            VkIngestionStagingBatch.id == VkIngestionStagingPart.batch_id,
        )
        .where(
            VkIngestionPartReference.status == "pending",
            VkIngestionPartReference.claim_id.is_not(None),
            VkIngestionPartReference.claim_expires_at <= now,
            VkIngestionStagingPart.status == "prepared",
            VkIngestionStagingBatch.status == "prepared",
        )
        .order_by(VkIngestionPartReference.claim_expires_at)
        .limit(limit)
    )
    if session.get_bind().dialect.name == "postgresql":
        statement = statement.with_for_update(
            of=VkIngestionPartReference,
            skip_locked=True,
        )
    rows = (await session.scalars(statement)).all()
    for row in rows:
        row.claim_id = None
        row.claimed_by = None
        row.claim_expires_at = None
        row.updated_at = now
    await session.flush()
    return len(rows)


async def _audit_batches(
    session: AsyncSession,
    *,
    now: datetime,
    limit: int,
) -> int:
    statement = (
        select(VkIngestionStagingBatch)
        .where(VkIngestionStagingBatch.status.in_(_AUDITED_BATCH_STATUSES))
        .order_by(VkIngestionStagingBatch.created_at, VkIngestionStagingBatch.id)
        .limit(limit)
    )
    if session.get_bind().dialect.name == "postgresql":
        statement = statement.with_for_update(
            of=VkIngestionStagingBatch,
            skip_locked=True,
        )
    batches = (await session.scalars(statement)).all()
    quarantined = 0
    for batch in batches:
        reason = await _inconsistency_reason(session, batch)
        if reason is None:
            continue
        await _quarantine_batch(session, batch.id, reason, now)
        quarantined += 1
    await session.flush()
    return quarantined


async def _inconsistency_reason(
    session: AsyncSession,
    batch: VkIngestionStagingBatch,
) -> str | None:
    try:
        batch_from_model(batch)
    except (TypeError, ValueError) as error:
        return f"staging batch manifest invalid: {error}"
    rows = (
        await session.execute(
            select(VkIngestionStagingPart, VkIngestionPartReference)
            .outerjoin(
                VkIngestionPartReference,
                VkIngestionPartReference.part_id == VkIngestionStagingPart.id,
            )
            .where(VkIngestionStagingPart.batch_id == batch.id)
            .order_by(VkIngestionStagingPart.part_index)
        )
    ).all()
    if batch.status == "staged":
        return "staged batch unexpectedly has prepared parts" if rows else None
    if not rows:
        return "non-staged batch has no prepared parts"
    if any(reference is None for _part, reference in rows):
        return "prepared part is missing publication reference"
    try:
        parts = tuple(part_from_model(part) for part, _reference in rows)
        references = tuple(
            IngestionPartReference(part_id=part.id, status=reference.status)
            for part, reference in rows
        )
        validate_part_set(parts, references)
    except (TypeError, ValueError) as error:
        return f"ingestion part manifest invalid: {error}"
    for part, reference in rows:
        if _PART_REFERENCE_PAIRS.get(part.status) != reference.status:
            return "part and publication reference lifecycle states disagree"
    if batch.status == "published" and any(part.status == "prepared" for part, _ in rows):
        return "published batch still contains prepared parts"
    if batch.status == "applied" and any(part.status != "applied" for part, _ in rows):
        return "applied batch contains a non-applied part"
    return None


async def _quarantine_batch(session: AsyncSession, batch_id, reason: str, at: datetime) -> None:
    part_ids = select(VkIngestionStagingPart.id).where(
        VkIngestionStagingPart.batch_id == batch_id
    )
    await session.execute(
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
    await session.execute(
        update(VkIngestionStagingPart)
        .where(VkIngestionStagingPart.batch_id == batch_id)
        .values(status="quarantined", updated_at=at)
    )
    await session.execute(
        update(VkIngestionStagingBatch)
        .where(VkIngestionStagingBatch.id == batch_id)
        .values(status="quarantined", updated_at=at)
    )
