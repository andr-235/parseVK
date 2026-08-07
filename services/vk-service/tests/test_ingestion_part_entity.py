from dataclasses import replace
from datetime import UTC, datetime
from uuid import UUID

import pytest

from app.domain.entities.ingestion_part_identity import (
    APPLICATION_HARD_LIMIT_BYTES,
    COMMENT_PART,
    POST_PART,
    IngestionPartVersions,
    deterministic_part_id,
)
from app.domain.entities.ingestion_parts import (
    IngestionPart,
    IngestionPartReference,
)

BATCH_ID = UUID("11111111-1111-1111-1111-111111111111")
PREPARED_AT = datetime(2026, 8, 7, tzinfo=UTC)


def make_part(**overrides):
    values = {
        "batch_id": BATCH_ID,
        "part_kind": POST_PART,
        "part_index": 0,
        "part_count": 1,
        "versions": IngestionPartVersions(),
        "item_manifest": ("post:-42:99",),
        "author_manifest": (-42,),
        "prepared_at": PREPARED_AT,
        "wire_bytes": b'{"event":"post"}',
    }
    values.update(overrides)
    return IngestionPart.create(**values)


def test_part_identity_is_stable_and_versioned():
    versions = IngestionPartVersions()

    first = deterministic_part_id(
        batch_id=BATCH_ID,
        part_kind=COMMENT_PART,
        versions=versions,
        part_index=2,
    )
    repeated = deterministic_part_id(
        batch_id=BATCH_ID,
        part_kind=COMMENT_PART,
        versions=versions,
        part_index=2,
    )
    changed = deterministic_part_id(
        batch_id=BATCH_ID,
        part_kind=COMMENT_PART,
        versions=IngestionPartVersions(packing=2),
        part_index=2,
    )

    assert first == repeated
    assert changed != first


def test_part_records_exact_wire_bytes_and_digest():
    part = make_part(wire_bytes="Привет 👋".encode())

    assert part.wire_bytes_count == len(part.wire_bytes)
    assert len(part.wire_digest) == 64
    assert len(part.part_digest) == 64
    assert part.verified_copy() == part


def test_part_rejects_invalid_position_and_hard_limit():
    with pytest.raises(ValueError, match="part_index"):
        make_part(part_index=1, part_count=1)

    with pytest.raises(ValueError, match="hard limit"):
        make_part(wire_bytes=b"x" * (APPLICATION_HARD_LIMIT_BYTES + 1))


def test_verified_copy_detects_manifest_or_wire_drift():
    part = make_part()

    with pytest.raises(ValueError, match="immutable manifest"):
        replace(part, wire_bytes=b"changed").verified_copy()

    with pytest.raises(ValueError, match="immutable manifest"):
        replace(part, author_manifest=(42,)).verified_copy()


def test_reference_contains_only_part_identity_and_status():
    part = make_part()
    reference = IngestionPartReference(part_id=part.message_id)

    assert reference.part_id == part.message_id
    assert reference.status == "pending"
    assert not hasattr(reference, "payload")
