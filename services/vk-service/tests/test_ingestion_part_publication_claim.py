from dataclasses import replace
from datetime import UTC, datetime, timedelta
from uuid import UUID

import pytest

from app.domain.entities.ingestion_part_identity import (
    COMMENT_PART,
    POST_PART,
    IngestionPartVersions,
)
from app.domain.entities.ingestion_part_publication import (
    COMMENT_PART_EVENT,
    POST_PART_EVENT,
    IngestionPartPublicationClaim,
)
from app.domain.entities.ingestion_parts import PUBLISHED, IngestionPart
from app.domain.entities.ingestion_staging import PREPARED, StagedIngestionBatch

EXECUTION_ID = UUID("11111111-1111-1111-1111-111111111111")
ATTEMPT_ID = UUID("22222222-2222-2222-2222-222222222222")
CLAIM_ID = UUID("33333333-3333-3333-3333-333333333333")
NOW = datetime(2026, 8, 7, tzinfo=UTC)


def prepared_batch(source_kind: str = "post_snapshot") -> StagedIngestionBatch:
    batch = StagedIngestionBatch.create(
        execution_id=EXECUTION_ID,
        attempt_id=ATTEMPT_ID,
        fencing_token=7,
        source_kind=source_kind,
        owner_id=-42,
        post_id=99,
        page_offset=0,
        payload={"schemaVersion": 1},
        staged_at=NOW,
    )
    return replace(batch, status=PREPARED)


def prepared_part(
    batch: StagedIngestionBatch,
    part_kind: str = POST_PART,
    *,
    status: str = "prepared",
) -> IngestionPart:
    return IngestionPart.create(
        batch_id=batch.batch_id,
        part_kind=part_kind,
        part_index=0,
        part_count=1,
        versions=IngestionPartVersions(),
        item_manifest=("post:-42:99",),
        author_manifest=(-42,),
        prepared_at=NOW,
        wire_bytes=b'{"schemaVersion":1}',
        status=status,
    )


def claim(
    part: IngestionPart | None = None,
    *,
    batch: StagedIngestionBatch | None = None,
) -> IngestionPartPublicationClaim:
    selected_batch = batch or prepared_batch()
    return IngestionPartPublicationClaim(
        claim_id=CLAIM_ID,
        worker_id="publisher-1",
        lease_expires_at=NOW + timedelta(minutes=1),
        attempts=1,
        batch=selected_batch,
        part=part or prepared_part(selected_batch),
    )


def test_claim_exposes_persisted_identity_and_post_routing() -> None:
    value = claim()

    assert value.event_id == value.part.message_id
    assert value.event_type == POST_PART_EVENT
    assert value.kafka_key == "-42:99"
    assert value.verified_copy() == value


def test_comment_claim_uses_comment_event_type() -> None:
    batch = prepared_batch("comment_page")
    value = claim(prepared_part(batch, COMMENT_PART), batch=batch)

    assert value.event_type == COMMENT_PART_EVENT
    assert value.kafka_key == "-42:99"


def test_claim_rejects_nonprepared_or_conflicting_source() -> None:
    batch = prepared_batch()
    with pytest.raises(ValueError, match="only prepared ingestion parts"):
        claim(prepared_part(batch, status=PUBLISHED), batch=batch)

    comment_batch = prepared_batch("comment_page")
    with pytest.raises(ValueError, match="source kind"):
        claim(prepared_part(comment_batch, POST_PART), batch=comment_batch)


def test_claim_rejects_wrong_batch_tampering_and_naive_lease() -> None:
    batch = prepared_batch()
    other = replace(batch, batch_id=UUID("44444444-4444-4444-4444-444444444444"))
    with pytest.raises(ValueError, match="does not belong"):
        claim(prepared_part(batch), batch=other)

    corrupted = replace(prepared_part(batch), wire_digest="0" * 64)
    with pytest.raises(ValueError, match="immutable manifest"):
        claim(corrupted, batch=batch)

    with pytest.raises(ValueError, match="timezone-aware"):
        replace(claim(), lease_expires_at=datetime(2026, 8, 7))
