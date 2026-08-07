import pytest
from _ingestion_part_repository_fixtures import create_batch, make_parts
from sqlalchemy import select

from app.domain.entities.ingestion_part_identity import IngestionPartVersions
from app.domain.repositories.ingestion_parts import IngestionPartConflictError
from app.infrastructure.db.models.ingestion_parts import (
    VkIngestionPartReference,
    VkIngestionStagingPart,
)
from app.infrastructure.db.repositories.ingestion_part_records import part_values
from app.infrastructure.db.repositories.ingestion_parts import (
    SqlAlchemyIngestionPartRepository,
)

pytestmark = pytest.mark.anyio


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
