import asyncio

import pytest
from _ingestion_staging_postgres import make_batch, stage, staging_postgres
from sqlalchemy import func, select

from app.domain.repositories.ingestion_staging import StagingPayloadConflictError
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.infrastructure.db.repositories.ingestion_staging import (
    SqlAlchemyIngestionStagingRepository,
)


class SimulatedWorkerCrash(RuntimeError):
    pass


@pytest.mark.anyio
async def test_postgres_staging_is_race_safe_and_rollback_recoverable():
    async with staging_postgres() as (session_factory, execution, attempts):
        first, second = await asyncio.gather(
            stage(session_factory, make_batch(execution, attempts[0])),
            stage(session_factory, make_batch(execution, attempts[1])),
        )
        assert sorted((first[1], second[1])) == [False, True]
        assert first[0].batch_id == second[0].batch_id

        async with session_factory() as session:
            count = await session.scalar(
                select(func.count()).select_from(VkIngestionStagingBatch)
            )
            assert count == 1

        with pytest.raises(StagingPayloadConflictError):
            await stage(
                session_factory,
                make_batch(execution, attempts[1], comment_id=2),
            )

        crash_batch = make_batch(execution, attempts[1], offset=300)
        with pytest.raises(SimulatedWorkerCrash):
            async with session_factory() as session, session.begin():
                await SqlAlchemyIngestionStagingRepository(session).stage(crash_batch)
                raise SimulatedWorkerCrash("before staging commit")

        recovered, created = await stage(session_factory, crash_batch)
        assert created is True
        assert recovered.batch_id == crash_batch.batch_id
