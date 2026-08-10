from datetime import UTC, datetime, timedelta
from uuid import UUID

import pytest
from _ingestion_part_publication_fixtures import prepare_parts

from app.infrastructure.db.models.ingestion_part_publication import VkIngestionPartReference
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.infrastructure.db.repositories.execution_retention import cleanup_blockers
from app.infrastructure.db.repositories.ingestion_payload_purge import purge_eligible_batches

pytestmark = pytest.mark.anyio


async def test_purge_manifest_and_payload_clear_commit_together(db_session) -> None:
    batch, parts = await prepare_parts(db_session)
    applied_at = datetime.now(UTC) - timedelta(hours=2)
    batch_model = await db_session.get(VkIngestionStagingBatch, batch.batch_id)
    batch_model.status = "applied"
    batch_model.applied_at = applied_at
    for index, part in enumerate(parts):
        part_model = await db_session.get(VkIngestionStagingPart, part.message_id)
        reference = await db_session.get(VkIngestionPartReference, part.message_id)
        part_model.status = "applied"
        part_model.applied_at = applied_at
        reference.status = "applied"
        reference.ack_event_id = UUID(f"aaaaaaaa-aaaa-aaaa-aaaa-{index + 1:012d}")
        reference.ack_receipt_id = UUID(f"bbbbbbbb-bbbb-bbbb-bbbb-{index + 1:012d}")
        reference.ack_applied_at = applied_at
        reference.ack_received_at = applied_at
        reference.ack_source_position = dict(batch.payload["source"])
        reference.ack_effect_summary = {"comments": 1}
    await db_session.flush()

    blockers = await cleanup_blockers(db_session, batch.execution_id)
    assert blockers and blockers[0]["status"] == "applied"
    purged = await purge_eligible_batches(
        db_session,
        older_than=datetime.now(UTC) - timedelta(hours=1),
        limit=10,
        purged_at=datetime.now(UTC),
    )
    assert purged == 1
    assert batch_model.status == "payload_purged"
    assert batch_model.payload is None
    assert batch_model.purge_manifest["pageDigest"] == batch.payload_digest
    assert len(batch_model.purge_manifest["parts"]) == len(parts)
    for part in parts:
        part_model = await db_session.get(VkIngestionStagingPart, part.message_id)
        assert part_model.status == "payload_purged"
        assert part_model.wire_bytes is None
    assert await cleanup_blockers(db_session, batch.execution_id) == ()


async def test_unacknowledged_payload_is_never_purged(db_session) -> None:
    batch, _parts = await prepare_parts(db_session)
    batch_model = await db_session.get(VkIngestionStagingBatch, batch.batch_id)
    batch_model.status = "published"
    await db_session.flush()
    assert await purge_eligible_batches(
        db_session,
        older_than=datetime.now(UTC),
        limit=10,
        purged_at=datetime.now(UTC),
    ) == 0
    assert batch_model.payload is not None
