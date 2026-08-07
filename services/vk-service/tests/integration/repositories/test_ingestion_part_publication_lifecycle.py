from datetime import UTC, datetime, timedelta

import pytest
from _ingestion_part_publication_fixtures import future_lease, prepare_parts

from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.infrastructure.db.repositories.ingestion_part_publication import (
    SqlAlchemyIngestionPartPublicationRepository,
)

pytestmark = pytest.mark.anyio


async def test_last_published_part_marks_batch_published(db_session) -> None:
    batch, _parts = await prepare_parts(db_session)
    repository = SqlAlchemyIngestionPartPublicationRepository(db_session)
    claims = await repository.claim_pending(
        worker_id="publisher-1",
        limit=10,
        lease_expires_at=future_lease(),
    )
    assert len(claims) == 2

    first, second = claims
    await repository.mark_published(
        claim_id=first.claim_id,
        part_id=first.part.message_id,
        wire_digest=first.part.wire_digest,
        published_at=datetime.now(UTC),
    )
    persisted_batch = await db_session.get(
        VkIngestionStagingBatch,
        batch.batch_id,
    )
    assert persisted_batch is not None
    assert persisted_batch.status == "prepared"

    await repository.mark_published(
        claim_id=second.claim_id,
        part_id=second.part.message_id,
        wire_digest=second.part.wire_digest,
        published_at=datetime.now(UTC),
    )
    assert persisted_batch.status == "published"
    for claim in claims:
        reference = await db_session.get(
            VkIngestionPartReference,
            claim.part.message_id,
        )
        part = await db_session.get(
            VkIngestionStagingPart,
            claim.part.message_id,
        )
        assert reference is not None and reference.status == "published"
        assert reference.claim_id is None
        assert part is not None and part.status == "published"


async def test_retry_releases_claim_with_backoff(db_session) -> None:
    _batch, _parts = await prepare_parts(db_session)
    repository = SqlAlchemyIngestionPartPublicationRepository(db_session)
    claims = await repository.claim_pending(
        worker_id="publisher-1",
        limit=2,
        lease_expires_at=future_lease(),
    )
    retry_at = datetime.now(UTC) + timedelta(minutes=10)

    await repository.release_for_retry(
        claim_id=claims[0].claim_id,
        part_id=claims[0].part.message_id,
        error="broker unavailable",
        next_attempt_at=retry_at,
    )
    reference = await db_session.get(
        VkIngestionPartReference,
        claims[0].part.message_id,
    )
    assert reference is not None
    assert reference.status == "pending"
    assert reference.claim_id is None
    assert reference.attempts == 1
    assert reference.last_error == "broker unavailable"
    assert reference.next_attempt_at == retry_at
    assert await repository.claim_pending(
        worker_id="publisher-2",
        limit=10,
        lease_expires_at=future_lease(),
    ) == ()


async def test_quarantine_is_terminal_for_entire_batch(db_session) -> None:
    batch, _parts = await prepare_parts(db_session)
    repository = SqlAlchemyIngestionPartPublicationRepository(db_session)
    claim = (
        await repository.claim_pending(
            worker_id="publisher-1",
            limit=1,
            lease_expires_at=future_lease(),
        )
    )[0]
    quarantined_at = datetime.now(UTC)

    await repository.quarantine(
        claim_id=claim.claim_id,
        part_id=claim.part.message_id,
        reason="wire digest mismatch",
        quarantined_at=quarantined_at,
    )
    reference = await db_session.get(
        VkIngestionPartReference,
        claim.part.message_id,
    )
    part = await db_session.get(
        VkIngestionStagingPart,
        claim.part.message_id,
    )
    persisted_batch = await db_session.get(
        VkIngestionStagingBatch,
        batch.batch_id,
    )
    assert reference is not None and reference.status == "quarantined"
    assert part is not None and part.status == "quarantined"
    assert persisted_batch is not None and persisted_batch.status == "quarantined"
    assert await repository.claim_pending(
        worker_id="publisher-2",
        limit=10,
        lease_expires_at=future_lease(),
    ) == ()
