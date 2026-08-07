import json
from datetime import UTC, datetime
from uuid import UUID

import pytest

from app.domain.entities.ingestion_part_identity import (
    APPLICATION_HARD_LIMIT_BYTES,
    IngestionPartVersions,
)
from app.services.ingestion.comment_part_packer import prepare_comment_parts

_BATCH_ID = UUID("11111111-1111-1111-1111-111111111111")
_PREPARED_AT = datetime(2026, 8, 7, tzinfo=UTC)


def comments(count: int, text_units: int) -> list[dict]:
    return [
        {
            "id": index + 1,
            "from_id": index + 1,
            "text": ("Ж🚂" * text_units) + str(index),
            "thread": {
                "items": [
                    {
                        "id": 10_000 + index,
                        "from_id": 100 + index,
                        "text": "nested 👋",
                    }
                ]
            },
        }
        for index in range(count)
    ]


def profiles(count: int) -> list[dict]:
    top_level = [
        {"id": index + 1, "first_name": f"Author {index + 1}"}
        for index in range(count)
    ]
    nested = [
        {"id": 100 + index, "first_name": f"Nested {index}"}
        for index in range(count)
    ]
    return [*top_level, *nested]


@pytest.mark.parametrize(
    ("count", "text_units"),
    [(1, 0), (3, 100), (8, 2_000), (6, 30_000), (4, 90_000)],
)
def test_packing_preserves_order_coverage_and_independent_parts(
    count: int,
    text_units: int,
) -> None:
    page_comments = comments(count, text_units)
    post = {"owner_id": -42, "id": 99, "from_id": -42, "text": "post"}
    parts = prepare_comment_parts(
        batch_id=_BATCH_ID,
        source={
            "kind": "comment_page",
            "ownerId": -42,
            "postId": 99,
            "pageOffset": 0,
            "nextOffset": count,
        },
        post=post,
        comments=page_comments,
        profiles=profiles(count),
        groups=[{"id": 42, "name": "Group"}],
        versions=IngestionPartVersions(),
        prepared_at=_PREPARED_AT,
    )

    decoded = [json.loads(part.wire_bytes)["payload"] for part in parts]
    packed_ids = [
        comment["id"]
        for payload in decoded
        for comment in payload["comments"]
    ]

    assert packed_ids == list(range(1, count + 1))
    assert all(part.wire_bytes_count <= APPLICATION_HARD_LIMIT_BYTES for part in parts)
    assert all(payload["post"] == post for payload in decoded)
    assert all(payload["comments"] for payload in decoded)
    assert all(-42 in part.author_manifest for part in parts)
    assert all(
        {comment["from_id"] for comment in payload["comments"]}
        <= {author["vkAuthorId"] for author in payload["authors"]}
        for payload in decoded
    )
    assert tuple(part.part_index for part in parts) == tuple(range(len(parts)))
    assert all(part.part_count == len(parts) for part in parts)
