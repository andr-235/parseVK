from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from _ingestion_part_publication_fixtures import prepare_parts

from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.infrastructure.db.repositories.ingestion_lifecycle_repair import (
    repair_local_lifecycle,
)

pytestmark = pytest.mark.anyio


async def test_repair_recovers_missing_reference_and_expired_claim(db_session) -> None:
    _batch, parts = await prepare_parts(db_session)
    missing = await db_session.get(VkIngestionPartReference, parts[0].message_id)
    stale = await db_session.get(VkIngestionPartReference, parts[1].message_id)
    assert missing is not None and stale is not None
    await db_session.delete(missing)
    stale.claim_id = uuid4()
    stale.claimed_by = "dead-worker"
    stale.claim_expires_at = datetime.now(UTC) - timedelta(minutes=1)
    await db_session.flush()

    stats = await repair_local_lifecycle(
        db_session,
        now=datetime.now(UTC),
        limit=10,
    )

    recovered = await db_session.get(VkIngestionPartReference, parts[0].message_id)
    released = await db_session.get(VkIngestionPartReference, parts[1].message_id)
    assert stats.missing_references == 1
    assert stats.expired_claims == 1
    assert stats.quarantined_batches == 0
    assert recovered is not None and recovered.status == "pending"
    assert released is not None and released.claim_id is None
    assert released.claimed_by is None
    assert released.claim_expires_at is None


async def test_repair_quarantines_impossible_part_reference_state(db_session) -> None:
    batch, parts = await prepare_parts(db_session)
    reference = await db_session.get(VkIngestionPartReference, parts[0].message_id)
    assert reference is not None
    reference.status = "published"
    await db_session.flush()

    stats = await repair_local_lifecycle(
        db_session,
        now=datetime.now(UTC),
        limit=10,
    )

    persisted = await db_session.get(VkIngestionStagingBatch, batch.batch_id)
    assert stats.quarantined_batches == 1
    assert persisted is not None and persisted.status == "quarantined"
    assert "lifecycle states disagree" in reference.last_error
