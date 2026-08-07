from types import SimpleNamespace
from uuid import UUID

import pytest

from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.domain.repositories.ingestion_staging import StagingPayloadIntegrityError
from app.services.ingestion.post_collector import PostCollector
from app.services.ingestion.staging_writer import (
    POST_SNAPSHOT,
    STAGING_SCHEMA_VERSION,
    PhysicalIngestionStager,
)


class MemoryStagingRepository:
    def __init__(self):
        self.batches = {}
        self.stage_calls = 0

    async def get(self, batch_id):
        return self.batches.get(batch_id)

    async def stage(self, batch):
        self.stage_calls += 1
        self.batches[batch.batch_id] = batch
        return batch, True


class RecordingIngestionRepository:
    def __init__(self):
        self.authors = []
        self.posts = []

    async def upsert_author(self, author):
        self.authors.append(author)

    async def upsert_post(self, post, *, task_id, group_id):
        self.posts.append((post, task_id, group_id))


def make_collector():
    staging_repository = MemoryStagingRepository()
    claim = SimpleNamespace(
        execution_id=UUID("11111111-1111-1111-1111-111111111111"),
        attempt_id=UUID("22222222-2222-2222-2222-222222222222"),
        fencing_token=7,
    )
    local_repository = RecordingIngestionRepository()
    collector = PostCollector(
        adapter=SimpleNamespace(),
        repository=local_repository,
        staging=PhysicalIngestionStager.from_claim(staging_repository, claim),
        require_staging=True,
    )
    return collector, staging_repository, local_repository


@pytest.mark.anyio
async def test_resume_reuses_the_first_immutable_post_snapshot():
    collector, staging_repository, local_repository = make_collector()
    task_run = SimpleNamespace(task_id=10)
    original = {
        "owner_id": -42,
        "id": 99,
        "from_id": -42,
        "text": "original",
        "likes": {"count": 1},
    }
    changed = {
        **original,
        "text": "changed",
        "likes": {"count": 2},
    }
    original_profiles = {
        -42: {"id": 42, "name": "Group", "photo_50": "old-photo"}
    }
    changed_profiles = {
        -42: {"id": 42, "name": "Renamed", "photo_50": "new-photo"}
    }

    first_author, first_post = await collector.save_post(
        original,
        task_run,
        original_profiles,
    )
    second_author, second_post = await collector.save_post(
        changed,
        task_run,
        changed_profiles,
    )

    assert first_author is True
    assert second_author is True
    assert first_post == original
    assert second_post == original
    assert staging_repository.stage_calls == 1
    assert local_repository.posts[-1][0] == original
    assert local_repository.authors[-1]["display_name"] == "Group"
    assert local_repository.authors[-1]["photo_50"] == "old-photo"


@pytest.mark.anyio
async def test_reused_snapshot_rejects_author_without_required_fields():
    collector, staging_repository, local_repository = make_collector()
    post = {"owner_id": -42, "id": 99, "from_id": -42}
    staging = collector.staging
    batch = StagedIngestionBatch.create(
        execution_id=staging.execution_id,
        attempt_id=staging.attempt_id,
        fencing_token=staging.fencing_token,
        source_kind=POST_SNAPSHOT,
        owner_id=-42,
        post_id=99,
        page_offset=0,
        payload={
            "schemaVersion": STAGING_SCHEMA_VERSION,
            "source": {
                "kind": POST_SNAPSHOT,
                "ownerId": -42,
                "postId": 99,
                "pageOffset": 0,
                "nextOffset": None,
            },
            "observed": {"post": post, "authors": [{}]},
            "providerMetadata": {},
        },
    )
    staging_repository.batches[batch.batch_id] = batch

    with pytest.raises(StagingPayloadIntegrityError, match="author identity"):
        await collector.save_post(
            post,
            SimpleNamespace(task_id=10),
            {},
        )

    assert local_repository.authors == []
    assert local_repository.posts == []
