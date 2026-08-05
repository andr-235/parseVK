import asyncio
import os
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from parsevk_contracts.vk.commands import VkExecutionRequested
from sqlalchemy import func, select

from _canonical_runtime_helpers import make_command, seed_account

from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.source_collections import VkTaskRunBinding
from app.infrastructure.db.repositories.canonical_binding_progress import (
    report_binding_progress,
)
from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)
from app.infrastructure.db.repositories.canonical_executions import (
    CanonicalExecutionRepository,
)

REPEATS = int(os.getenv("P0_P2_CONCURRENCY_REPEATS", "1"))
pytestmark = pytest.mark.integration


async def _attach(factory, command):
    async with factory() as session:
        async with session.begin():
            return await CanonicalVkCommandRepository(session).attach_command(command)


def _two_source_command(task_id: int) -> VkExecutionRequested:
    first = make_command(task_id=task_id, source_id=uuid4(), external_id=7001)
    second = make_command(task_id=task_id, source_id=uuid4(), external_id=7002)
    return VkExecutionRequested(
        task_id=first.task_id,
        task_run_id=first.task_run_id,
        execution_id=first.execution_id,
        owner_user_id=first.owner_user_id,
        demands=(first.demands[0], second.demands[0]),
        post_selection=first.post_selection,
        comment_selection=first.comment_selection,
        task_revision=first.task_revision,
        source_set_revision=first.source_set_revision,
        snapshot_sha256=first.snapshot_sha256,
    )


@pytest.mark.anyio
@pytest.mark.parametrize("_repeat", range(REPEATS))
async def test_progress_and_terminal_updates_emit_one_taskrun_terminal(
    pg_factory,
    _repeat,
):
    command = _two_source_command(task_id=3301)
    await _attach(pg_factory, command)

    async with pg_factory() as session:
        async with session.begin():
            await seed_account(session)
            repository = CanonicalExecutionRepository(session)
            first = await repository.claim_next(
                worker_id="worker-a",
                lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
            )
            second = await repository.claim_next(
                worker_id="worker-b",
                lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
            )
    assert first is not None and second is not None

    async def report_progress():
        async with pg_factory() as session:
            async with session.begin():
                return await report_binding_progress(
                    session,
                    execution_id=first.execution_id,
                    processed_items=3,
                    total_items=10,
                    stats={"comments": 3},
                    occurred_at=datetime.now(UTC).isoformat(),
                )

    async def complete_second():
        async with pg_factory() as session:
            async with session.begin():
                return await CanonicalExecutionRepository(session).complete(
                    execution_id=second.execution_id,
                    attempt_id=second.attempt_id,
                    fencing_token=second.fencing_token,
                    processed_items=7,
                    total_items=7,
                    stats={"comments": 7},
                )

    emitted, completed = await asyncio.gather(report_progress(), complete_second())
    assert emitted == 1
    assert completed

    async with pg_factory() as session:
        async with session.begin():
            binding = await session.scalar(
                select(VkTaskRunBinding).where(
                    VkTaskRunBinding.run_id == str(command.task_run_id)
                )
            )
            terminal_count = await session.scalar(
                select(func.count(OutboxEvent.id)).where(
                    OutboxEvent.event_type == "task.execution_completed",
                    OutboxEvent.aggregate_id == str(command.task_id),
                )
            )
            assert binding is not None and binding.status == "running"
            assert terminal_count == 0
            assert await CanonicalExecutionRepository(session).complete(
                execution_id=first.execution_id,
                attempt_id=first.attempt_id,
                fencing_token=first.fencing_token,
                processed_items=10,
                total_items=10,
                stats={"comments": 10},
            )

    async with pg_factory() as session:
        terminal_count = await session.scalar(
            select(func.count(OutboxEvent.id)).where(
                OutboxEvent.event_type == "task.execution_completed",
                OutboxEvent.aggregate_id == str(command.task_id),
            )
        )
    assert terminal_count == 1
