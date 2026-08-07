import json
from datetime import UTC, datetime
from uuid import UUID

from app.domain.entities.ingestion_part_identity import (
    COMMENT_PART,
    POST_PART,
    IngestionPartVersions,
)
from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.services.ingestion.part_preparer import prepare_staged_batch

EXECUTION_ID = UUID("11111111-1111-1111-1111-111111111111")
ATTEMPT_ID = UUID("22222222-2222-2222-2222-222222222222")
PREPARED_AT = datetime(2026, 8, 7, tzinfo=UTC)
VERSIONS = IngestionPartVersions()


def staged_batch(source_kind, payload):
    return StagedIngestionBatch.create(
        execution_id=EXECUTION_ID,
        attempt_id=ATTEMPT_ID,
        fencing_token=7,
        source_kind=source_kind,
        owner_id=-42,
        post_id=99,
        page_offset=0,
        payload=payload,
    )


def test_post_snapshot_produces_one_post_only_part():
    batch = staged_batch(
        "post_snapshot",
        {
            "schemaVersion": 1,
            "source": {
                "kind": "post_snapshot",
                "ownerId": -42,
                "postId": 99,
                "pageOffset": 0,
                "nextOffset": None,
            },
            "observed": {
                "post": {
                    "owner_id": -42,
                    "id": 99,
                    "from_id": -42,
                    "text": "Пост без комментариев 👋",
                },
                "authors": [
                    {
                        "vk_author_id": -42,
                        "type": "group",
                        "display_name": "Группа",
                    }
                ],
            },
            "providerMetadata": {},
        },
    )

    prepared = prepare_staged_batch(
        batch,
        versions=VERSIONS,
        prepared_at=PREPARED_AT,
    )

    assert len(prepared.parts) == 1
    part = prepared.parts[0]
    assert part.part_kind == POST_PART
    assert part.item_manifest == ("post:-42:99",)
    assert part.author_manifest == (-42,)
    wire = json.loads(part.wire_bytes)
    assert wire["payload"]["comments"] == []
    assert wire["payload"]["post"]["text"] == "Пост без комментариев 👋"
    assert prepared.references[0].part_id == part.message_id
    assert not hasattr(prepared.references[0], "payload")


def test_comment_part_contains_post_nested_authors_and_no_unused_author():
    batch = staged_batch(
        "comment_page",
        {
            "schemaVersion": 1,
            "source": {
                "kind": "comment_page",
                "ownerId": -42,
                "postId": 99,
                "pageOffset": 0,
                "nextOffset": 1,
            },
            "observed": {
                "post": {"owner_id": -42, "id": 99, "from_id": -42},
                "comments": [
                    {
                        "id": 10,
                        "from_id": 1,
                        "text": "Комментарий",
                        "thread": {
                            "items": [
                                {"id": 11, "from_id": 2, "text": "Ответ 🚂"}
                            ]
                        },
                    }
                ],
                "profiles": [
                    {"id": 1, "first_name": "Первый"},
                    {"id": 2, "first_name": "Второй"},
                    {"id": 777, "first_name": "Лишний"},
                ],
                "groups": [{"id": 42, "name": "Группа"}],
            },
            "providerMetadata": {"count": 1},
        },
    )

    prepared = prepare_staged_batch(
        batch,
        versions=VERSIONS,
        prepared_at=PREPARED_AT,
    )

    assert len(prepared.parts) == 1
    part = prepared.parts[0]
    assert part.part_kind == COMMENT_PART
    assert part.item_manifest == ("comment:10", "comment:11")
    assert part.author_manifest == (-42, 1, 2)
    wire = json.loads(part.wire_bytes)
    assert wire["payload"]["post"]["id"] == 99
    assert {author["vkAuthorId"] for author in wire["payload"]["authors"]} == {
        -42,
        1,
        2,
    }
    assert 777 not in part.author_manifest
    assert part.wire_bytes_count == len(part.wire_bytes)
