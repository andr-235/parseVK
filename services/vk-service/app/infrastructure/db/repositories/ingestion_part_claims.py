from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.ingestion_part_publication import (
    IngestionPartPublicationClaim,
)
from app.domain.entities.ingestion_parts import PREPARED
from app.domain.entities.ingestion_staging import PREPARED as BATCH_PREPARED
from app.domain.repositories.ingestion_part_publication import (
    IngestionPartPublicationIntegrityError,
)
from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.infrastructure.db.repositories.ingestion_part_publication_records import (
    claim_from_models,
)
from app.infrastructure.db.repositories.ingestion_part_publication_terminal import (
    quarantine,
)


async def claim_pending(
    session: AsyncSession,
    *,
    worker_id: str,
    limit: int,
    lease_expires_at: datetime,
) -> tuple[IngestionPartPublicationClaim, ...]:
    now = datetime.now(UTC)
    _validate_request(worker_id, limit, lease_expires_at, now)
    statement = _claim_statement(now, limit)
    if session.get_bind().dialect.name == "postgresql":
        statement = statement.with_for_update(
            of=VkIngestionPartReference,
            skip_locked=True,
        )
    rows = (await session.execute(statement)).all()
    for reference, _part, _batch in rows:
        reference.claim_id = uuid4()
        reference.claimed_by = worker_id
        reference.claim_expires_at = lease_expires_at
        reference.attempts += 1
        reference.updated_at = now
    await session.flush()

    claims: list[IngestionPartPublicationClaim] = []
    terminal_batches = set()
    for reference, part, batch in rows:
        if batch.id in terminal_batches:
            continue
        try:
            claims.append(claim_from_models(reference, part, batch))
        except IngestionPartPublicationIntegrityError as error:
            await quarantine(
                session,
                claim_id=reference.claim_id,
                part_id=part.id,
                reason=str(error),
                quarantined_at=now,
            )
            terminal_batches.add(batch.id)
    return tuple(claims)


def _claim_statement(now: datetime, limit: int):
    return (
        select(
            VkIngestionPartReference,
            VkIngestionStagingPart,
            VkIngestionStagingBatch,
        )
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
            VkIngestionPartReference.next_attempt_at <= now,
            or_(
                VkIngestionPartReference.claim_id.is_(None),
                VkIngestionPartReference.claim_expires_at <= now,
            ),
            VkIngestionStagingPart.status == PREPARED,
            VkIngestionStagingBatch.status == BATCH_PREPARED,
        )
        .order_by(
            VkIngestionPartReference.next_attempt_at,
            VkIngestionPartReference.created_at,
            VkIngestionStagingPart.part_index,
        )
        .limit(limit)
    )


def _validate_request(
    worker_id: str,
    limit: int,
    lease_expires_at: datetime,
    now: datetime,
) -> None:
    if not worker_id or len(worker_id) > 128:
        raise ValueError("worker_id must contain 1..128 characters")
    if not 1 <= limit <= 1000:
        raise ValueError("claim limit must be between 1 and 1000")
    if lease_expires_at.tzinfo is None or lease_expires_at <= now:
        raise ValueError("claim lease must expire in the future")
