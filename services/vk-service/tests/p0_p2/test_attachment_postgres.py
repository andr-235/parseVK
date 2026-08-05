import asyncio
import os
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from _canonical_runtime_helpers import cancel_command, make_command, seed_account
from sqlalchemy import func, select

from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
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


async def _cancel(factory, command):
    async with factory() as session:
        async with session.begin():
            return await CanonicalVkCommandRepository(session).request_cancellation(
                cancel_command(command)
            )


@pytest.mark.anyio
@pytest.mark.parametrize("_repeat", range(REPEATS))
async def test_concurrent_compatible_attachments_coalesce(pg_factory, _repeat):
    source_id = uuid4()
    first = make_command(task_id=3001, source_id=source_id)
    second = make_command(task_id=3002, source_id=source_id)

    await asyncio.gather(_attach(pg_factory, first), _attach(pg_factory, second))

    async with pg_factory() as session:
        assert await session.scalar(select(func.count(VkSourceCollection.id))) == 1
        assert await session.scalar(select(func.count(VkExecution.id))) == 1
        assert await session.scalar(select(func.count(VkCollectionDemand.id))) == 2
        assert await session.scalar(select(func.count(VkTaskRunBinding.id))) == 2


@pytest.mark.anyio
@pytest.mark.parametrize("_repeat", range(REPEATS))
async def test_cancellation_racing_with_attachment_loses_neither_intent(
    pg_factory,
    _repeat,
):
    source_id = uuid4()
    first = make_command(task_id=3101, source_id=source_id)
    second = make_command(task_id=3102, source_id=source_id)
    await _attach(pg_factory, first)

    await asyncio.gather(_cancel(pg_factory, first), _attach(pg_factory, second))

    async with pg_factory() as session:
        first_binding = await session.scalar(
            select(VkTaskRunBinding).where(
                VkTaskRunBinding.run_id == str(first.task_run_id)
            )
        )
        second_binding = await session.scalar(
            select(VkTaskRunBinding).where(
                VkTaskRunBinding.run_id == str(second.task_run_id)
            )
        )
    assert first_binding is not None and first_binding.status == "cancelled"
    assert second_binding is not None
    assert second_binding.status in {"pending", "running"}


@pytest.mark.anyio
@pytest.mark.parametrize("_repeat", range(REPEATS))
async def test_late_join_receives_started_lifecycle(pg_factory, _repeat):
    source_id = uuid4()
    first = make_command(task_id=3201, source_id=source_id)
    first_attachment = await _attach(pg_factory, first)

    async with pg_factory() as session:
        async with session.begin():
            await seed_account(session)
            claim = await CanonicalExecutionRepository(session).claim_next(
                worker_id="late-join-worker",
                lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
            )
    assert claim is not None

    late = make_command(task_id=3202, source_id=source_id)
    attached = await _attach(pg_factory, late)
    assert attached.attachments[0].outcome == "coalesced"
    assert attached.attachments[0].demand.status == "running"
    assert (
        first_attachment.attachments[0].execution.id
        == attached.attachments[0].execution.id
    )

    async with pg_factory() as session:
        binding = await session.scalar(
            select(VkTaskRunBinding).where(
                VkTaskRunBinding.run_id == str(late.task_run_id)
            )
        )
        started_ids = set(
            await session.scalars(
                select(OutboxEvent.aggregate_id).where(
                    OutboxEvent.event_type == "task.execution_started"
                )
            )
        )
    assert binding is not None and binding.status == "running"
    assert started_ids == {str(first.task_id), str(late.task_id)}
