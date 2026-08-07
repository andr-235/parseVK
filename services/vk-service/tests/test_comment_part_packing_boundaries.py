from datetime import UTC, datetime
from uuid import UUID

import pytest

from app.domain.entities.ingestion_part_identity import (
    APPLICATION_HARD_LIMIT_BYTES,
    COMMENT_PART,
    PACKING_TARGET_BYTES,
    IngestionPartVersions,
)
from app.services.ingestion.comment_part_packer import prepare_comment_parts
from app.services.ingestion.part_authors import author_records, referenced_author_ids
from app.services.ingestion.part_errors import OversizedIngestionItemError
from app.services.ingestion.part_wire import serialize_ingestion_part_wire

BATCH_ID = UUID("11111111-1111-1111-1111-111111111111")
PREPARED_AT = datetime(2026, 8, 7, tzinfo=UTC)
VERSIONS = IngestionPartVersions()
SOURCE = {
    "kind": "comment_page",
    "ownerId": -42,
    "postId": 99,
    "pageOffset": 0,
    "nextOffset": 1,
}
POST = {"owner_id": -42, "id": 99, "from_id": -42}
PROFILES = [{"id": 1, "first_name": "Автор"}]
GROUPS = [{"id": 42, "name": "Группа"}]


def exact_comment(target_bytes: int, *, comment_id: int = 10) -> dict:
    comment = {"id": comment_id, "from_id": 1, "text": ""}
    authors = author_records(
        referenced_author_ids(POST, [comment]),
        profiles=PROFILES,
        groups=GROUPS,
    )
    base = serialize_ingestion_part_wire(
        batch_id=BATCH_ID,
        source=SOURCE,
        part_kind=COMMENT_PART,
        part_index=0,
        part_count=1,
        versions=VERSIONS,
        prepared_at=PREPARED_AT,
        post=POST,
        comments=[comment],
        authors=authors,
    )
    padding = target_bytes - len(base)
    if padding < 0:
        raise AssertionError("target is smaller than the fixed event envelope")
    comment["text"] = "x" * padding
    actual = serialize_ingestion_part_wire(
        batch_id=BATCH_ID,
        source=SOURCE,
        part_kind=COMMENT_PART,
        part_index=0,
        part_count=1,
        versions=VERSIONS,
        prepared_at=PREPARED_AT,
        post=POST,
        comments=[comment],
        authors=authors,
    )
    assert len(actual) == target_bytes
    return comment


def prepare(comments):
    return prepare_comment_parts(
        batch_id=BATCH_ID,
        source=SOURCE,
        post=POST,
        comments=comments,
        profiles=PROFILES,
        groups=GROUPS,
        versions=VERSIONS,
        prepared_at=PREPARED_AT,
    )


def test_exact_target_stays_in_one_part():
    parts = prepare([exact_comment(PACKING_TARGET_BYTES)])

    assert len(parts) == 1
    assert parts[0].wire_bytes_count == PACKING_TARGET_BYTES


def test_singleton_may_exceed_target_but_not_hard_limit():
    parts = prepare([exact_comment(PACKING_TARGET_BYTES + 1)])

    assert len(parts) == 1
    assert parts[0].wire_bytes_count == PACKING_TARGET_BYTES + 1


def test_two_individually_small_comments_split_when_combined_exceeds_target():
    comments = [
        exact_comment(300 * 1024, comment_id=10),
        exact_comment(300 * 1024, comment_id=11),
    ]

    parts = prepare(comments)

    assert len(parts) == 2
    assert [part.part_index for part in parts] == [0, 1]
    assert all(part.part_count == 2 for part in parts)
    assert all(part.wire_bytes_count <= PACKING_TARGET_BYTES for part in parts)


def test_exact_hard_limit_is_allowed():
    parts = prepare([exact_comment(APPLICATION_HARD_LIMIT_BYTES)])

    assert len(parts) == 1
    assert parts[0].wire_bytes_count == APPLICATION_HARD_LIMIT_BYTES


def test_hard_limit_plus_one_uses_typed_failure():
    comment = exact_comment(APPLICATION_HARD_LIMIT_BYTES + 1)

    with pytest.raises(OversizedIngestionItemError) as error:
        prepare([comment])

    assert error.value.item_kind == "comment"
    assert error.value.item_identity == "comment:10"
    assert error.value.wire_bytes_count == APPLICATION_HARD_LIMIT_BYTES + 1
