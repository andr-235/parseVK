import os
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from _canonical_runtime_helpers import make_command, seed_account

from app.domain.repositories.checkpoint import CheckpointData
from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)
from app.infrastructure.db.repositories.canonical_executions import (
    CanonicalExecutionRepository,
)
from app.infrastructure.db.repositories.checkpoint import (
    SqlAlchemyIngestionCheckpointStore,
)
from app.tasks.execution_control import ExecutionAttemptControl, FenceLostError

REPEATS = int(os.getenv("P0_P2_CONCURRENCY_REPEATS", "1"))
pytestmark = pytest.mark.integration


async def _attach(factory, command):
    async with factory() as session:
        async with session.begin():
            return await CanonicalVkCommandRepository(session).attach_command(command)


@pytest.mark.anyio
@pytest.mark.parametrize("_repeat", range(REPEATS))
async def test_stale_attempt_cannot_commit_checkpoint_or_terminal(
    pg_factory,
    _repeat,
):
    command = make_command(task_id=3401, source_id=uuid4(), external_id=1)
    await _attach(pg_factory, command)

    async with pg_factory() as session:
        async with session.begin():
            await seed_account(session)
            repository = CanonicalExecutionRepository(session)
            stale = await repository.claim_next(
                worker_id="stale-worker",
                lease_expires_at=datetime.now(UTC) - timedelta(seconds=1),
            )
            current = await repository.claim_next(
                worker_id="current-worker",
                lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
            )
    assert stale is not None and current is not None
    control = ExecutionAttemptControl(claim=stale, session_factory=pg_factory)

    with pytest.raises(FenceLostError):
        async with pg_factory() as session:
            async with session.begin():
                await SqlAlchemyIngestionCheckpointStore(session).save(
                    CheckpointData(
                        run_id=stale.run_id,
                        owner_id=-1,
                        post_id=99,
                        task_id=stale.task_id,
                        group_id=1,
                        next_offset=100,
                    )
                )
                await control.ensure_active_in_session(session)

    async with pg_factory() as session:
        repository = CanonicalExecutionRepository(session)
        checkpoint = await SqlAlchemyIngestionCheckpointStore(session).load(
            stale.run_id,
            -1,
            99,
        )
        assert checkpoint is None
        assert not await repository.renew(
            execution_id=stale.execution_id,
            attempt_id=stale.attempt_id,
            fencing_token=stale.fencing_token,
            lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
        )
        assert not await repository.complete(
            execution_id=stale.execution_id,
            attempt_id=stale.attempt_id,
            fencing_token=stale.fencing_token,
            processed_items=999,
            total_items=999,
        )
        assert await repository.complete(
            execution_id=current.execution_id,
            attempt_id=current.attempt_id,
            fencing_token=current.fencing_token,
            processed_items=1,
            total_items=1,
        )
        await session.commit()
