import os
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from _canonical_runtime_helpers import make_command, seed_account
from sqlalchemy import func, select

from app.domain.repositories.checkpoint import CheckpointData
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)
from app.infrastructure.db.repositories.canonical_executions import (
    CanonicalExecutionRepository,
)
from app.infrastructure.db.repositories.checkpoint import (
    SqlAlchemyIngestionCheckpointStore,
)

REPEATS = int(os.getenv("P0_P2_CONCURRENCY_REPEATS", "1"))
pytestmark = pytest.mark.integration


async def _attach(factory, command):
    async with factory() as session:
        async with session.begin():
            return await CanonicalVkCommandRepository(session).attach_command(command)


@pytest.mark.anyio
@pytest.mark.parametrize("_repeat", range(REPEATS))
async def test_crash_recovery_reuses_checkpoint_and_emits_one_terminal_event(
    pg_factory,
    _repeat,
):
    command = make_command(task_id=3501, source_id=uuid4(), external_id=1)
    await _attach(pg_factory, command)

    async with pg_factory() as session:
        async with session.begin():
            await seed_account(session)
            repository = CanonicalExecutionRepository(session)
            stale = await repository.claim_next(
                worker_id="worker-before-crash",
                lease_expires_at=datetime.now(UTC) - timedelta(seconds=1),
            )
            assert stale is not None
            await SqlAlchemyIngestionCheckpointStore(session).save(
                CheckpointData(
                    run_id=stale.run_id,
                    owner_id=-1,
                    post_id=10,
                    task_id=stale.task_id,
                    group_id=1,
                    next_offset=200,
                    processed_comments=200,
                    status="in_progress",
                )
            )

    async with pg_factory() as session:
        async with session.begin():
            current = await CanonicalExecutionRepository(session).claim_next(
                worker_id="worker-after-crash",
                lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
            )
    assert current is not None
    assert current.execution_id == stale.execution_id
    assert current.attempt_number == stale.attempt_number + 1

    async with pg_factory() as session:
        async with session.begin():
            repository = CanonicalExecutionRepository(session)
            checkpoint = await SqlAlchemyIngestionCheckpointStore(session).load(
                current.run_id,
                -1,
                10,
            )
            assert checkpoint is not None
            assert checkpoint.next_offset == 200
            assert checkpoint.processed_comments == 200
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
                processed_items=250,
                total_items=250,
            )

    async with pg_factory() as session:
        terminal_count = await session.scalar(
            select(func.count(OutboxEvent.id)).where(
                OutboxEvent.event_type == "task.execution_completed",
                OutboxEvent.aggregate_id == str(command.task_id),
            )
        )
    assert terminal_count == 1
