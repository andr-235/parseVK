from datetime import UTC, datetime
from uuid import UUID

import pytest

from app.domain.entities.ingestion_part_identity import IngestionPartVersions
from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.services.ingestion.part_authors import PartSourceIntegrityError
from app.services.ingestion.part_preparer import prepare_staged_batch

EXECUTION_ID = UUID("11111111-1111-1111-1111-111111111111")
ATTEMPT_ID = UUID("22222222-2222-2222-2222-222222222222")
PREPARED_AT = datetime(2026, 8, 7, tzinfo=UTC)


def _payload() -> dict:
    return {
        "schemaVersion": 1,
        "source": {
            "kind": "comment_page",
            "ownerId": -42,
            "postId": 99,
            "pageOffset": 10,
            "nextOffset": 20,
        },
        "observed": {
            "post": {"owner_id": -42, "id": 99, "from_id": -42},
            "comments": [],
            "profiles": [],
            "groups": [],
        },
        "providerMetadata": {"count": 0},
    }


@pytest.mark.parametrize(
    ("path", "value", "message"),
    [
        (("source", "ownerId"), -41, "source ownerId"),
        (("source", "ownerId"), -42.0, "source ownerId"),
        (("source", "postId"), 100, "source postId"),
        (("source", "pageOffset"), 11, "source pageOffset"),
        (("observed", "post", "owner_id"), -41, "post owner_id"),
        (("observed", "post", "id"), 100, "post id"),
    ],
)
def test_conflicting_staged_position_is_rejected(
    path: tuple[str, ...],
    value: object,
    message: str,
) -> None:
    payload = _payload()
    target = payload
    for key in path[:-1]:
        target = target[key]
    target[path[-1]] = value
    batch = StagedIngestionBatch.create(
        execution_id=EXECUTION_ID,
        attempt_id=ATTEMPT_ID,
        fencing_token=7,
        source_kind="comment_page",
        owner_id=-42,
        post_id=99,
        page_offset=10,
        payload=payload,
        staged_at=PREPARED_AT,
    )

    with pytest.raises(PartSourceIntegrityError, match=message):
        prepare_staged_batch(
            batch,
            versions=IngestionPartVersions(),
            prepared_at=PREPARED_AT,
        )
