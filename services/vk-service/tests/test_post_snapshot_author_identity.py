from types import SimpleNamespace
from uuid import UUID

import pytest

from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.domain.repositories.ingestion_staging import StagingPayloadIntegrityError
from app.services.ingestion.post_snapshot_reuse import stage_or_reuse_post_snapshot
from app.services.ingestion.staging_writer import (
    POST_SNAPSHOT,
    STAGING_SCHEMA_VERSION,
    PhysicalIngestionStager,
)


class ExistingBatchRepository:
    def __init__(self, batch):
        self.batch = batch

    async def get(self, batch_id):
        return self.batch if batch_id == self.batch.batch_id else None

    async def stage(self, batch):
        raise AssertionError("existing snapshot must be reused")


def make_staging(author):
    claim = SimpleNamespace(
        execution_id=UUID("11111111-1111-1111-1111-111111111111"),
        attempt_id=UUID("22222222-2222-2222-2222-222222222222"),
        fencing_token=7,
    )
    post = {"owner_id": -42, "id": 99, "from_id": -42}
    batch = StagedIngestionBatch.create(
        execution_id=claim.execution_id,
        attempt_id=claim.attempt_id,
        fencing_token=claim.fencing_token,
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
            "observed": {"post": post, "authors": [author]},
            "providerMetadata": {},
        },
    )
    staging = PhysicalIngestionStager.from_claim(
        ExistingBatchRepository(batch),
        claim,
    )
    return staging, post


@pytest.mark.anyio
async def test_reused_author_type_must_match_signed_vk_id():
    staging, post = make_staging({"vk_author_id": -42, "type": "user"})

    with pytest.raises(StagingPayloadIntegrityError, match="type conflicts"):
        await stage_or_reuse_post_snapshot(
            staging,
            post=post,
            authors=[],
        )


@pytest.mark.anyio
@pytest.mark.parametrize("author_id", [42.5, True, 0, "42"])
async def test_reused_author_id_must_be_a_nonzero_integer(author_id):
    staging, post = make_staging(
        {"vk_author_id": author_id, "type": "user"}
    )

    with pytest.raises(StagingPayloadIntegrityError, match="identity is invalid"):
        await stage_or_reuse_post_snapshot(
            staging,
            post=post,
            authors=[],
        )
