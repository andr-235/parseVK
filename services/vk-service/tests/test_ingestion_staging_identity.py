from dataclasses import replace
from uuid import UUID, uuid4

import pytest

from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch


def build_batch(**overrides) -> StagedIngestionBatch:
    values = {
        "execution_id": UUID("11111111-1111-1111-1111-111111111111"),
        "attempt_id": UUID("22222222-2222-2222-2222-222222222222"),
        "fencing_token": 7,
        "source_kind": "comments",
        "owner_id": -42,
        "post_id": 99,
        "page_offset": 200,
        "payload": {"comments": [{"id": 2}, {"id": 1}], "next_offset": 300},
    }
    values.update(overrides)
    return StagedIngestionBatch.create(**values)


def test_identity_and_digest_are_deterministic() -> None:
    first = build_batch()
    second = build_batch(
        payload={"next_offset": 300, "comments": [{"id": 2}, {"id": 1}]}
    )

    assert first.batch_id == second.batch_id
    assert first.payload_digest == second.payload_digest
    assert first.payload_bytes == second.payload_bytes
    assert first.payload == second.payload


def test_new_attempt_reuses_same_physical_page_identity() -> None:
    first = build_batch()
    replay = build_batch(attempt_id=uuid4(), fencing_token=8)

    assert replay.batch_id == first.batch_id
    assert replay.payload_digest == first.payload_digest
    assert replay.staged_by_attempt_id != first.staged_by_attempt_id


def test_attempt_uuid_is_provenance_not_lifecycle_ownership() -> None:
    column = VkIngestionStagingBatch.__table__.c.staged_by_attempt_id
    assert column.nullable is False
    assert not column.foreign_keys


def test_changed_payload_keeps_position_identity_but_changes_digest() -> None:
    first = build_batch()
    changed = build_batch(payload={"comments": [{"id": 3}], "next_offset": 300})

    assert changed.batch_id == first.batch_id
    assert changed.payload_digest != first.payload_digest


def test_invalid_position_and_payload_are_rejected() -> None:
    with pytest.raises(ValueError, match="page_offset"):
        build_batch(page_offset=-1)
    with pytest.raises(ValueError, match="finite JSON"):
        build_batch(payload={"value": float("nan")})
    with pytest.raises(ValueError, match="fencing_token"):
        build_batch(fencing_token=0)


def test_nested_payload_mutation_is_detected() -> None:
    batch = build_batch()
    batch.payload["comments"][0]["id"] = 999

    with pytest.raises(ValueError, match="digest and byte count"):
        batch.verified_copy()


def test_non_deterministic_batch_id_is_detected() -> None:
    batch = replace(build_batch(), batch_id=uuid4())

    with pytest.raises(ValueError, match="source position"):
        batch.verified_copy()


def test_verified_copy_is_deeply_isolated() -> None:
    batch = build_batch()
    verified = batch.verified_copy()

    assert verified == batch
    assert verified.payload is not batch.payload
    assert verified.payload["comments"] is not batch.payload["comments"]


def test_batch_is_immutable() -> None:
    batch = build_batch()
    updated = replace(batch, status="persisted")
    assert batch.status == "staged"
    assert updated.status == "persisted"
