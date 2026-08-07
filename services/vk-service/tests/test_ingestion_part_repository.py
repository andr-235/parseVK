from datetime import UTC, datetime
from uuid import UUID

import pytest
from sqlalchemy import select

from app.domain.entities.ingestion_part_identity import (
    COMMENT_PART,
    IngestionPartVersions,
)
from app.domain.entities.ingestion_parts import (
    IngestionPart,
    IngestionPartReference,
)
from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.domain.repositories.ingestion_parts import IngestionPartConflictError
from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.models.ingestion_parts import (
    VkIngestionPartReference,
    VkIngestionStagingPart,
)
from app.infrastructure.db.repositories.ingestion_part_records import part_values
from app.infrastructure.db.repositories.ingestion_parts import (
    SqlAlchemyIngestionPartRepository,
)
from app.infrastructure.db.repositories.ingestion_staging import (
    SqlAlchemyIngestionStagingRepository,
)

EXECUTION_ID = UUID("11111111-1111-1111-1111-111111111111")
ATTEMPT_ID = UUID("22222222-2222-2222-2222-222222222222")
PREPARED_AT = datetime(2026, 8, 7, tzinfo=UTC)


async def create_batch(session):
    session.add(
        VkExecution(
            id=EXECUTION_ID,
            task_id=10,
            owner_user_id="user-1",
            run_id="run-1",
            status="running",
            plan_snapshot={"source": {"externalId": "42"}},
        )
    )
    await session.flush()
    batch = StagedIngestionBatch.create(
        execution_id=EXECUTION_ID,
        attempt_id=ATTEMPT_ID,
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
                "nextOffset": 2,
            },
            "observed": {"post": {"owner_id": -42, "id": 99}},
            "providerMetadata": {},
        },
    )
    stored, _ = await SqlAlchemyIngestionStagingRepository(session).stage(batch)
    return stored


def make_parts(batch_id, *, versions=IngestionPartVersions(), suffix=""):
    parts = tuple(
        IngestionPart.create(
            batch_id=batch_id,
            part_kind=COMMENT_PART,
            part_index=index,
            part_count=2,
            versions=versions,
            item_manifest=(f"comment:{index}",),
            author_manifest=(index + 1,),
            prepared_at=PREPARED_AT,
            wire_bytes=f'{{"part":{index},"suffix":"{suffix}"}}'.encode(),
        )
        for index in range(2)
    )
    references = tuple(
        IngestionPartReference(part_id=part.message_id) for part in parts
    )
    return parts, references


@pytest.mark.anyio
async def test_prepare_persists_complete_idempotent_set(db_session):
    batch = await create_batch(db_session)
    parts, references = make_parts(batch.batch_id)
    repository = SqlAlchemyIngestionPartRepository(db_session)

    stored, created = await repository.prepare(parts, references)
    repeated, repeated_created = await repository.prepare(parts, references)

    assert created is True
    assert repeated_created is False
    assert stored == repeated == parts
    rows = (
        await db_session.scalars(select(VkIngestionPartReference))
    ).all()
    assert {(row.part_id, row.status) for row in rows} == {
        (part.message_id, "pending") for part in parts
    }


@pytest.mark.anyio
async def test_preparation_replay_accepts_published_lifecycle_state(db_session):
    batch = await create_batch(db_session)
    parts, references = make_parts(batch.batch_id)
    repository = SqlAlchemyIngestionPartRepository(db_session)
    await repository.prepare(parts, references)

    stored_parts = (
        await db_session.scalars(select(VkIngestionStagingPart))
    ).all()
    stored_references = (
        await db_session.scalars(select(VkIngestionPartReference))
    ).all()
    for part in stored_parts:
        part.status = "published"
    for reference in stored_references:
        reference.status = "published"
    await db_session.flush()

    replayed, created = await repository.prepare(parts, references)

    assert created is False
    assert all(part.status == "published" for part in replayed)
    assert [part.wire_bytes for part in replayed] == [part.wire_bytes for part in parts]


@pytest.mark.anyio
async def test_prepare_rejects_repacking_or_changed_wire_bytes(db_session):
    batch = await create_batch(db_session)
    parts, references = make_parts(batch.batch_id)
    repository = SqlAlchemyIngestionPartRepository(db_session)
    await repository.prepare(parts, references)

    changed, changed_references = make_parts(batch.batch_id, suffix="changed")
    with pytest.raises(IngestionPartConflictError):
        await repository.prepare(changed, changed_references)

    repacked, repacked_references = make_parts(
        batch.batch_id,
        versions=IngestionPartVersions(packing=2),
    )
    with pytest.raises(IngestionPartConflictError):
        await repository.prepare(repacked, repacked_references)


@pytest.mark.anyio
async def test_prepare_refuses_to_complete_partial_existing_set(db_session):
    batch = await create_batch(db_session)
    parts, references = make_parts(batch.batch_id)
    db_session.add(VkIngestionStagingPart(**part_values(parts[0])))
    await db_session.flush()

    with pytest.raises(IngestionPartConflictError):
        await SqlAlchemyIngestionPartRepository(db_session).prepare(
            parts,
            references,
        )
