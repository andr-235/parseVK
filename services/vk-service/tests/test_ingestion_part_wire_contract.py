import json
from datetime import UTC, datetime
from uuid import UUID

import pytest

from app.domain.entities.ingestion_part_identity import (
    COMMENT_PART,
    POST_PART,
    IngestionPartVersions,
    deterministic_part_id,
)
from app.services.ingestion.part_wire import (
    COMMENT_PART_EVENT_TYPE,
    POST_PART_EVENT_TYPE,
    serialize_ingestion_part_wire,
)

_BATCH_ID = UUID("11111111-1111-1111-1111-111111111111")
_PREPARED_AT = datetime(2026, 8, 7, 1, 2, 3, tzinfo=UTC)
_VERSIONS = IngestionPartVersions()


@pytest.mark.parametrize(
    ("part_kind", "event_type"),
    [
        (POST_PART, POST_PART_EVENT_TYPE),
        (COMMENT_PART, COMMENT_PART_EVENT_TYPE),
    ],
)
def test_prepared_wire_uses_frozen_publisher_contract(
    part_kind: str,
    event_type: str,
) -> None:
    wire = json.loads(
        serialize_ingestion_part_wire(
            batch_id=_BATCH_ID,
            source={"ownerId": -42, "postId": 99},
            part_kind=part_kind,
            part_index=0,
            part_count=1,
            versions=_VERSIONS,
            prepared_at=_PREPARED_AT,
            post={"owner_id": -42, "id": 99},
            comments=[] if part_kind == POST_PART else [{"id": 1}],
            authors=[],
        )
    )
    expected_id = deterministic_part_id(
        batch_id=_BATCH_ID,
        part_kind=part_kind,
        versions=_VERSIONS,
        part_index=0,
    )

    assert wire["event_type"] == event_type
    assert wire["event_id"] == str(expected_id)
    assert wire["event_version"] == _VERSIONS.event_contract
    assert wire["aggregate_type"] == "vk_ingestion_batch"
    assert wire["aggregate_id"] == str(_BATCH_ID)
    assert wire["created_at"] == _PREPARED_AT.isoformat()
    assert wire["payload"]["partId"] == str(expected_id)
    assert wire["payload"]["batchId"] == str(_BATCH_ID)
    assert not {"taskId", "runId", "userId", "demandId"} & set(
        wire["payload"]
    )


def test_event_type_constants_match_p3_publisher_contract() -> None:
    assert POST_PART_EVENT_TYPE == "vk.ingestion.post-part-prepared"
    assert COMMENT_PART_EVENT_TYPE == "vk.ingestion.comment-part-prepared"
