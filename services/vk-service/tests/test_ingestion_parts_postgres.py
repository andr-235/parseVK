import asyncio
from datetime import UTC, datetime

import pytest
from sqlalchemy import func, select

from _ingestion_staging_postgres import staging_postgres
from app.domain.entities.ingestion_part_identity import IngestionPartVersions
from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.domain.repositories.ingestion_parts import IngestionPartConflictError
from app.infrastructure.db.models.ingestion_parts import (
    VkIngestionPartReference,
    VkIngestionStagingPart,
)
from app.infrastructure.db.repositories.ingestion_parts import (
    SqlAlchemyIngestionPartRepository,
)
from app.infrastructure.db.repositories.ingestion_staging import (
    SqlAlchemyIngestionStagingRepository,
)
from app.services.ingestion.part_preparer import prepare_staged_batch
from app.services.ingestion.staging_envelopes import post_snapshot_payload
from app.services.ingestion.staging_writer import POST_SNAPSHOT, STAGING_SCHEMA_VERSION

pytestmark = [pytest.mark.anyio, pytest.mark.postgres]
_STAGED_AT = datetime(2026, 8, 7, 1, 2, 3, tzinfo=UTC)


async def _stage_post(session_factory, execution, attempt, post_id: int):
    post = {"owner_id": -42, "id": post_id, "from_id": -42, "text": "post"}
    batch = StagedIngestionBatch.create(
        execution_id=execution.id,
        attempt_id=attempt.id,
        fencing_token=attempt.fencing_token,
        source_kind=POST_SNAPSHOT,
        owner_id=-42,
        post_id=post_id,
        page_offset=0,
        payload=post_snapshot_payload(
            schema_version=STAGING_SCHEMA_VERSION,
            source_kind=POST_SNAPSHOT,
            owner_id=-42,
            post_id=post_id,
            post=post,
            authors=[
                {
                    "vk_author_id": -42,
                    "type": "group",
                    "display_name": "Group",
                }
            ],
        ),
        staged_at=_STAGED_AT,
    )
    async with session_factory() as session, session.begin():
        stored, created = await SqlAlchemyIngestionStagingRepository(session).stage(
            batch
        )
    assert created is True
    return stored


def _prepared(batch, versions=IngestionPartVersions()):
    return prepare_staged_batch(
        batch,
        versions=versions,
        prepared_at=batch.staged_at,
    )


async def _prepare_once(session_factory, prepared):
    async with session_factory() as session, session.begin():
        return await SqlAlchemyIngestionPartRepository(session).prepare(
            prepared.parts,
            prepared.references,
        )


async def test_postgres_concurrent_preparation_creates_one_complete_set():
    async with staging_postgres() as (session_factory, execution, attempts):
        stored = await _stage_post(session_factory, execution, attempts[0], 99)
        prepared = _prepared(stored)

        first, second = await asyncio.gather(
            _prepare_once(session_factory, prepared),
            _prepare_once(session_factory, prepared),
        )

        assert sorted([first[1], second[1]]) == [False, True]
        assert first[0] == second[0] == prepared.parts
        async with session_factory() as session:
            part_count = await session.scalar(
                select(func.count(VkIngestionStagingPart.id))
            )
            reference_count = await session.scalar(
                select(func.count(VkIngestionPartReference.part_id))
            )
            stored_part = await session.scalar(select(VkIngestionStagingPart))

        assert part_count == 1
        assert reference_count == 1
        assert stored_part is not None
        assert bytes(stored_part.wire_bytes) == prepared.parts[0].wire_bytes
        assert stored_part.wire_digest == prepared.parts[0].wire_digest


async def test_postgres_concurrent_versions_cannot_prepare_two_sets():
    async with staging_postgres() as (session_factory, execution, attempts):
        stored = await _stage_post(session_factory, execution, attempts[0], 100)
        version_one = _prepared(stored)
        version_two = _prepared(stored, IngestionPartVersions(packing=2))

        results = await asyncio.gather(
            _prepare_once(session_factory, version_one),
            _prepare_once(session_factory, version_two),
            return_exceptions=True,
        )

        assert sum(isinstance(result, IngestionPartConflictError) for result in results) == 1
        assert sum(isinstance(result, tuple) for result in results) == 1
        async with session_factory() as session:
            rows = (
                await session.scalars(
                    select(VkIngestionStagingPart).where(
                        VkIngestionStagingPart.batch_id == stored.batch_id
                    )
                )
            ).all()
            references = (
                await session.scalars(
                    select(VkIngestionPartReference).where(
                        VkIngestionPartReference.part_id.in_([row.id for row in rows])
                    )
                )
            ).all()

        assert len(rows) == 1
        assert len(references) == 1
        assert rows[0].packing_version in {1, 2}
