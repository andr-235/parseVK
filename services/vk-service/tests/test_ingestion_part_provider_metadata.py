import json
from datetime import UTC, datetime
from uuid import UUID

from app.domain.entities.ingestion_part_identity import IngestionPartVersions
from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.services.ingestion.part_preparer import prepare_staged_batch

_EXECUTION_ID = UUID("11111111-1111-1111-1111-111111111111")
_ATTEMPT_ID = UUID("22222222-2222-2222-2222-222222222222")
_PREPARED_AT = datetime(2026, 8, 7, tzinfo=UTC)


def staged_page(provider_metadata: dict) -> StagedIngestionBatch:
    return StagedIngestionBatch.create(
        execution_id=_EXECUTION_ID,
        attempt_id=_ATTEMPT_ID,
        fencing_token=7,
        source_kind="comment_page",
        owner_id=-42,
        post_id=99,
        page_offset=0,
        payload={
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
                "comments": [{"id": 1, "from_id": 5, "text": "comment"}],
                "profiles": [{"id": 5, "first_name": "Alice"}],
                "groups": [{"id": 42, "name": "Group"}],
            },
            "providerMetadata": provider_metadata,
        },
        staged_at=_PREPARED_AT,
    )


def prepare(batch: StagedIngestionBatch):
    return prepare_staged_batch(
        batch,
        versions=IngestionPartVersions(),
        prepared_at=batch.staged_at,
    ).parts[0]


def test_provider_metadata_is_preserved_in_exact_wire_bytes() -> None:
    part = prepare(staged_page({"count": 1, "current_level_count": 1}))
    payload = json.loads(part.wire_bytes)["payload"]

    assert payload["source"]["providerMetadata"] == {
        "count": 1,
        "current_level_count": 1,
    }


def test_provider_metadata_growth_changes_wire_size_and_digest() -> None:
    compact = prepare(staged_page({"count": 1}))
    expanded = prepare(
        staged_page({"count": 1, "continuation": "Ж🚂" * 1_000})
    )

    assert expanded.wire_bytes_count > compact.wire_bytes_count
    assert expanded.wire_digest != compact.wire_digest
    assert expanded.part_digest != compact.part_digest
