from dataclasses import replace
from datetime import UTC, datetime
from uuid import UUID

import pytest
from _ingestion_part_publication_fixtures import prepare_parts

from app.domain.entities.ingestion_ack import (
    IngestionAckVersions,
    IngestionPartAppliedAck,
)
from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.infrastructure.db.repositories.ingestion_ack import (
    SqlAlchemyIngestionAckRepository,
)

pytestmark = pytest.mark.anyio


def _ack(batch, part, *, event_suffix: int, page_digest: str | None = None):
    return IngestionPartAppliedAck(
        ack_event_id=UUID(f"aaaaaaaa-aaaa-aaaa-aaaa-{event_suffix:012d}"),
        source_message_id=part.message_id,
        batch_id=batch.batch_id,
        part_kind=part.part_kind,
        part_index=part.part_index,
        part_count=part.part_count,
        versions=IngestionAckVersions(
            staging_schema=part.versions.staging_schema,
            packing=part.versions.packing,
            event_contract=part.versions.event_contract,
        ),
        source_position=dict(batch.payload["source"]),
        page_digest=page_digest or batch.payload_digest,
        part_digest=part.part_digest,
        wire_digest=part.wire_digest,
        receipt_id=UUID(f"bbbbbbbb-bbbb-bbbb-bbbb-{event_suffix:012d}"),
        applied_at=datetime(2026, 8, 9, 12, event_suffix, tzinfo=UTC),
        effect_summary={"comments": 1},
    )


async def test_ack_replay_and_last_part_apply_batch_atomically(db_session) -> None:
    batch, parts = await prepare_parts(db_session)
    repository = SqlAlchemyIngestionAckRepository(db_session)
    first = _ack(batch, parts[0], event_suffix=1)
    second = _ack(batch, parts[1], event_suffix=2)

    assert await repository.apply(first, received_at=datetime.now(UTC)) == "applied"
    partially_applied = await db_session.get(VkIngestionStagingBatch, batch.batch_id)
    assert partially_applied is not None
    assert partially_applied.status != "applied"
    assert await repository.apply(first, received_at=datetime.now(UTC)) == "replayed"
    assert await repository.apply(second, received_at=datetime.now(UTC)) == "batch_applied"

    persisted_batch = await db_session.get(VkIngestionStagingBatch, batch.batch_id)
    assert persisted_batch is not None and persisted_batch.status == "applied"
    for part in parts:
        persisted = await db_session.get(VkIngestionStagingPart, part.message_id)
        reference = await db_session.get(VkIngestionPartReference, part.message_id)
        assert persisted is not None and persisted.status == "applied"
        assert reference is not None and reference.status == "applied"
        assert reference.ack_receipt_id is not None


async def test_ack_digest_mismatch_quarantines_batch(db_session) -> None:
    batch, parts = await prepare_parts(db_session)
    ack = _ack(batch, parts[0], event_suffix=3, page_digest="f" * 64)

    outcome = await SqlAlchemyIngestionAckRepository(db_session).apply(
        ack,
        received_at=datetime.now(UTC),
    )
    assert outcome == "quarantined"
    persisted_batch = await db_session.get(VkIngestionStagingBatch, batch.batch_id)
    assert persisted_batch is not None and persisted_batch.status == "quarantined"


async def test_ack_receipt_identity_collision_quarantines_batch(db_session) -> None:
    batch, parts = await prepare_parts(db_session)
    repository = SqlAlchemyIngestionAckRepository(db_session)
    first = _ack(batch, parts[0], event_suffix=4)
    second = replace(
        _ack(batch, parts[1], event_suffix=5),
        receipt_id=first.receipt_id,
    )

    assert await repository.apply(first, received_at=datetime.now(UTC)) == "applied"
    assert await repository.apply(second, received_at=datetime.now(UTC)) == "quarantined"
    persisted_batch = await db_session.get(VkIngestionStagingBatch, batch.batch_id)
    assert persisted_batch is not None and persisted_batch.status == "quarantined"
