from datetime import UTC, datetime, timedelta

from _ingestion_part_repository_fixtures import create_batch, make_parts

from app.infrastructure.db.repositories.ingestion_parts import (
    SqlAlchemyIngestionPartRepository,
)

NOW = datetime.now(UTC)


async def prepare_parts(session):
    batch = await create_batch(session)
    parts, references = make_parts(batch.batch_id)
    await SqlAlchemyIngestionPartRepository(session).prepare(parts, references)
    await session.flush()
    return batch, parts


def future_lease(minutes: int = 5):
    return datetime.now(UTC) + timedelta(minutes=minutes)
