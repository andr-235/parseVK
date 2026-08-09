from datetime import UTC, datetime, timedelta

import pytest
from _ingestion_part_publication_fixtures import future_lease, prepare_parts
from sqlalchemy import select

from app.domain.repositories.ingestion_part_publication import (
    IngestionPartPublicationConflictError,
)
from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.repositories.ingestion_part_publication import (
    SqlAlchemyIngestionPartPublicationRepository,
)

pytestmark = pytest.mark.anyio


async def test_expired_claim_is_reassigned_and_stale_worker_is_fenced(
    db_session,
) -> None:
    _batch, parts = await prepare_parts(db_session)
    repository = SqlAlchemyIngestionPartPublicationRepository(db_session)

    first = await repository.claim_pending(
        worker_id="publisher-1",
        limit=1,
        lease_expires_at=future_lease(),
    )
    second = await repository.claim_pending(
        worker_id="publisher-2",
        limit=2,
        lease_expires_at=future_lease(),
    )

    assert len(first) == len(second) == 1
    assert first[0].part.message_id != second[0].part.message_id
    assert first[0].attempts == second[0].attempts == 1

    reference = await db_session.get(
        VkIngestionPartReference,
        first[0].part.message_id,
    )
    assert reference is not None
    reference.claim_expires_at = datetime.now(UTC) - timedelta(seconds=1)
    await db_session.flush()

    reclaimed = await repository.claim_pending(
        worker_id="publisher-3",
        limit=1,
        lease_expires_at=future_lease(),
    )
    assert len(reclaimed) == 1
    assert reclaimed[0].part.message_id == first[0].part.message_id
    assert reclaimed[0].claim_id != first[0].claim_id
    assert reclaimed[0].attempts == 2

    with pytest.raises(IngestionPartPublicationConflictError):
        await repository.mark_published(
            claim_id=first[0].claim_id,
            part_id=parts[0].message_id,
            wire_digest=parts[0].wire_digest,
            published_at=datetime.now(UTC),
        )


async def test_missing_reference_is_recovered_without_payload(db_session) -> None:
    _batch, parts = await prepare_parts(db_session)
    repository = SqlAlchemyIngestionPartPublicationRepository(db_session)
    missing = await db_session.get(VkIngestionPartReference, parts[0].message_id)
    assert missing is not None
    await db_session.delete(missing)
    await db_session.flush()

    assert await repository.recover_missing_references(limit=10) == 1
    assert await repository.recover_missing_references(limit=10) == 0

    rows = (
        await db_session.scalars(
            select(VkIngestionPartReference).order_by(
                VkIngestionPartReference.part_id
            )
        )
    ).all()
    assert {row.part_id for row in rows} == {
        part.message_id for part in parts
    }
    assert all(row.status == "pending" for row in rows)
    assert all(not hasattr(row, "payload") for row in rows)
