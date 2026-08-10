from datetime import UTC, datetime
from uuid import UUID

import pytest

from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.services.ingestion.prepared_stager import PreparedPhysicalIngestionStager

pytestmark = pytest.mark.anyio


def batch(source_kind: str = "post_snapshot") -> StagedIngestionBatch:
    return StagedIngestionBatch.create(
        execution_id=UUID("11111111-1111-1111-1111-111111111111"),
        attempt_id=UUID("22222222-2222-2222-2222-222222222222"),
        fencing_token=7,
        source_kind=source_kind,
        owner_id=-42,
        post_id=99,
        page_offset=0,
        payload={"sourceKind": source_kind},
        staged_at=datetime(2026, 8, 7, 1, 0, tzinfo=UTC),
    )


class FakePhysicalStager:
    def __init__(self, events: list[str]):
        self.events = events
        self.repository = object()
        self.execution_id = UUID("11111111-1111-1111-1111-111111111111")
        self.attempt_id = UUID("22222222-2222-2222-2222-222222222222")
        self.fencing_token = 7

    async def stage_post(self, **_kwargs):
        self.events.append("stage-post")
        return batch(), True

    async def stage_comment_page(self, **_kwargs):
        self.events.append("stage-comment-page")
        return batch("comment_page"), True


class FakePartPreparer:
    def __init__(self, events: list[str]):
        self.events = events
        self.batches: list[StagedIngestionBatch] = []

    async def prepare(self, staged: StagedIngestionBatch):
        self.events.append("prepare-parts")
        self.batches.append(staged)
        return (), True


async def test_post_parts_are_prepared_after_staging() -> None:
    events: list[str] = []
    parts = FakePartPreparer(events)
    prepared = PreparedPhysicalIngestionStager(
        staging=FakePhysicalStager(events),
        parts=parts,
    )

    staged, created = await prepared.stage_post(post={}, authors=[])

    assert created is True
    assert events == ["stage-post", "prepare-parts"]
    assert parts.batches == [staged]


async def test_comment_parts_are_prepared_after_staging() -> None:
    events: list[str] = []
    parts = FakePartPreparer(events)
    prepared = PreparedPhysicalIngestionStager(
        staging=FakePhysicalStager(events),
        parts=parts,
    )

    staged, created = await prepared.stage_comment_page(
        post={},
        page={},
        page_offset=0,
        next_offset=1,
    )

    assert created is True
    assert events == ["stage-comment-page", "prepare-parts"]
    assert parts.batches == [staged]


async def test_existing_batch_is_prepared_before_reuse() -> None:
    events: list[str] = []
    parts = FakePartPreparer(events)
    prepared = PreparedPhysicalIngestionStager(
        staging=FakePhysicalStager(events),
        parts=parts,
    )
    existing = batch()

    await prepared.prepare_existing(existing)

    assert events == ["prepare-parts"]
    assert parts.batches == [existing]
