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

BATCH_ID = UUID("11111111-1111-1111-1111-111111111111")
CLAIM_ID = UUID("22222222-2222-2222-2222-222222222222")
NOW = datetime(2026, 8, 7, tzinfo=UTC)


def prepared_part(part_kind: str = POST_PART, *, status: str = "prepared") -> IngestionPart:
    return IngestionPart.create(
        batch_id=BATCH_ID,
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
    source_kind: str = "post_snapshot",
) -> IngestionPartPublicationClaim:
    return IngestionPartPublicationClaim(
        claim_id=CLAIM_ID,
        worker_id="publisher-1",
        lease_expires_at=NOW + timedelta(minutes=1),
        attempts=1,
        source_kind=source_kind,
        owner_id=-42,
        post_id=99,
        page_offset=0,
        part=part or prepared_part(),
    )


def test_claim_exposes_persisted_identity_and_post_routing() -> None:
    value = claim()

    assert value.event_id == value.part.message_id
    assert value.event_type == POST_PART_EVENT
    assert value.kafka_key == "-42:99"
    assert value.verified_copy() == value


def test_comment_claim_uses_comment_event_type() -> None:
    value = claim(
        prepared_part(COMMENT_PART),
        source_kind="comment_page",
    )

    assert value.event_type == COMMENT_PART_EVENT
    assert value.kafka_key == "-42:99"


def test_claim_rejects_nonprepared_or_conflicting_source() -> None:
    with pytest.raises(ValueError, match="only prepared"):
        claim(prepared_part(status=PUBLISHED))
    with pytest.raises(ValueError, match="source kind"):
        claim(source_kind="comment_page")


def test_claim_rejects_tampered_part_and_naive_lease() -> None:
    corrupted = replace(prepared_part(), wire_digest="0" * 64)
    with pytest.raises(ValueError, match="immutable manifest"):
        claim(corrupted)

    with pytest.raises(ValueError, match="timezone-aware"):
        replace(claim(), lease_expires_at=datetime(2026, 8, 7))
