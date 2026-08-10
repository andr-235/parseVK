import json
from datetime import UTC, datetime
from uuid import UUID

import pytest

from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.services.ingestion.part_preparation_service import (
    IngestionPartPreparationService,
)
from app.services.ingestion.staging_envelopes import post_snapshot_payload
from app.services.ingestion.staging_writer import POST_SNAPSHOT, STAGING_SCHEMA_VERSION

pytestmark = pytest.mark.anyio


class CapturingPartRepository:
    def __init__(self):
        self.calls = []

    async def prepare(self, parts, references):
        self.calls.append((parts, references))
        return parts, len(self.calls) == 1


def staged_post() -> StagedIngestionBatch:
    staged_at = datetime(2026, 8, 7, 1, 2, 3, tzinfo=UTC)
    post = {"owner_id": -42, "id": 99, "from_id": -42, "text": "Привет 👋"}
    authors = [
        {
            "vk_author_id": -42,
            "type": "group",
            "display_name": "Группа",
        }
    ]
    return StagedIngestionBatch.create(
        execution_id=UUID("11111111-1111-1111-1111-111111111111"),
        attempt_id=UUID("22222222-2222-2222-2222-222222222222"),
        fencing_token=7,
        source_kind=POST_SNAPSHOT,
        owner_id=-42,
        post_id=99,
        page_offset=0,
        payload=post_snapshot_payload(
            schema_version=STAGING_SCHEMA_VERSION,
            source_kind=POST_SNAPSHOT,
            owner_id=-42,
            post_id=99,
            post=post,
            authors=authors,
        ),
        staged_at=staged_at,
    )


async def test_preparation_uses_immutable_staging_timestamp() -> None:
    repository = CapturingPartRepository()
    service = IngestionPartPreparationService(repository)
    batch = staged_post()

    parts, created = await service.prepare(batch)

    assert created is True
    assert len(parts) == 1
    assert parts[0].prepared_at == batch.staged_at
    wire = json.loads(parts[0].wire_bytes)
    assert wire["created_at"] == batch.staged_at.isoformat()


async def test_repeated_preparation_reproduces_exact_bytes_and_references() -> None:
    repository = CapturingPartRepository()
    service = IngestionPartPreparationService(repository)
    batch = staged_post()

    first, _ = await service.prepare(batch)
    second, _ = await service.prepare(batch)
    first_references = repository.calls[0][1]
    second_references = repository.calls[1][1]

    assert second == first
    assert second[0].wire_bytes == first[0].wire_bytes
    assert second[0].wire_digest == first[0].wire_digest
    assert second_references == first_references
    assert first_references[0].part_id == first[0].message_id
    assert first_references[0].status == "pending"
