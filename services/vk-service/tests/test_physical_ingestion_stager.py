from types import SimpleNamespace
from uuid import UUID

import pytest

from app.services.ingestion.staging_writer import (
    COMMENT_PAGE,
    POST_SNAPSHOT,
    PhysicalIngestionStager,
)


class RecordingRepository:
    def __init__(self):
        self.batches = []

    async def stage(self, batch):
        self.batches.append(batch)
        return batch, True


def stager():
    claim = SimpleNamespace(
        execution_id=UUID("11111111-1111-1111-1111-111111111111"),
        attempt_id=UUID("22222222-2222-2222-2222-222222222222"),
        fencing_token=7,
    )
    repository = RecordingRepository()
    return PhysicalIngestionStager.from_claim(repository, claim), repository


@pytest.mark.anyio
async def test_stages_post_snapshot_without_task_ownership():
    writer, repository = stager()

    batch, created = await writer.stage_post(
        post={"owner_id": -1, "id": 9, "from_id": -1, "text": "post"},
        authors=[
            {"vk_author_id": -1, "display_name": "Group"},
        ],
    )

    assert created is True
    assert batch.source_kind == POST_SNAPSHOT
    assert batch.page_offset == 0
    assert batch.payload["schemaVersion"] == 1
    assert batch.payload["observed"]["post"]["id"] == 9
    assert "taskId" not in str(batch.payload)
    assert repository.batches == [batch]


@pytest.mark.anyio
async def test_stages_comment_page_with_stable_source_position():
    writer, _ = stager()

    batch, _ = await writer.stage_comment_page(
        post={"owner_id": -1, "id": 9},
        page={
            "items": [{"id": 2}, {"id": 1}],
            "profiles": [{"id": 5}, {"id": 3}],
            "groups": [{"id": 8}, {"id": 4}],
            "count": 20,
        },
        page_offset=10,
        next_offset=12,
    )

    assert batch.source_kind == COMMENT_PAGE
    assert batch.page_offset == 10
    assert batch.payload["source"]["nextOffset"] == 12
    assert [item["id"] for item in batch.payload["observed"]["comments"]] == [2, 1]
    assert [item["id"] for item in batch.payload["observed"]["profiles"]] == [3, 5]
    assert [item["id"] for item in batch.payload["observed"]["groups"]] == [4, 8]
    assert batch.payload["providerMetadata"] == {"count": 20}


@pytest.mark.anyio
async def test_rejects_nested_task_attribution_before_repository_write():
    writer, repository = stager()

    with pytest.raises(ValueError, match=r"observed\.post\.taskId"):
        await writer.stage_post(
            post={"owner_id": -1, "id": 9, "taskId": 10},
            authors=[],
        )

    assert repository.batches == []
