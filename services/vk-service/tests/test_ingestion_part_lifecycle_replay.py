import pytest
from _ingestion_part_repository_fixtures import create_batch, make_parts
from sqlalchemy import select

from app.infrastructure.db.models.ingestion_parts import (
    VkIngestionPartReference,
    VkIngestionStagingPart,
)
from app.infrastructure.db.repositories.ingestion_parts import (
    SqlAlchemyIngestionPartRepository,
)

pytestmark = pytest.mark.anyio


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
