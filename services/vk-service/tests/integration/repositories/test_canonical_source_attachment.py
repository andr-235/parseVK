"""Integration tests for canonical source-level attachment and cancellation."""

from uuid import uuid4

import pytest
from sqlalchemy import func, select

from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)
from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)
from canonical_runtime_helpers import attach, cancel_command, make_command


@pytest.mark.anyio
async def test_exact_demands_share_one_physical_execution(db_session):
    source_id = uuid4()
    first = await attach(db_session, make_command(task_id=2001, source_id=source_id))
    second = await attach(db_session, make_command(task_id=2002, source_id=source_id))

    assert first.outcome == "created"
    assert second.outcome == "created"
    assert first.attachments[0].collection.id == second.attachments[0].collection.id
    assert first.attachments[0].execution.id == second.attachments[0].execution.id
    assert await db_session.scalar(select(func.count(VkSourceCollection.id))) == 1
    assert await db_session.scalar(select(func.count(VkExecution.id))) == 1
    assert await db_session.scalar(select(func.count(VkCollectionDemand.id))) == 2
    assert await db_session.scalar(select(func.count(VkTaskRunBinding.id))) == 2


@pytest.mark.anyio
async def test_plan_mismatch_creates_distinct_physical_executions(db_session):
    source_id = uuid4()
    first = await attach(
        db_session,
        make_command(task_id=2003, source_id=source_id, post_limit=10),
    )
    second = await attach(
        db_session,
        make_command(task_id=2004, source_id=source_id, post_limit=20),
    )

    assert first.attachments[0].collection.id != second.attachments[0].collection.id
    assert first.attachments[0].execution.id != second.attachments[0].execution.id


@pytest.mark.anyio
async def test_cancelling_one_binding_keeps_shared_work_active(db_session):
    source_id = uuid4()
    first_command = make_command(task_id=2005, source_id=source_id)
    second_command = make_command(task_id=2006, source_id=source_id)
    first = await attach(db_session, first_command)
    second = await attach(db_session, second_command)
    repository = CanonicalVkCommandRepository(db_session)

    cancelled = await repository.request_cancellation(cancel_command(first_command))

    assert cancelled is not None and cancelled.status == "cancelled"
    execution = await db_session.get(VkExecution, first.attachments[0].execution.id)
    collection = await db_session.get(
        VkSourceCollection,
        first.attachments[0].collection.id,
    )
    remaining = await db_session.scalar(
        select(VkCollectionDemand).where(
            VkCollectionDemand.binding_id == second.binding.id
        )
    )
    assert execution.status == "pending"
    assert execution.cancellation_requested_at is None
    assert collection.status == "pending"
    assert remaining is not None and remaining.status == "pending"


@pytest.mark.anyio
async def test_last_cancellation_stops_pending_shared_work(db_session):
    source_id = uuid4()
    first_command = make_command(task_id=2007, source_id=source_id)
    second_command = make_command(task_id=2008, source_id=source_id)
    first = await attach(db_session, first_command)
    await attach(db_session, second_command)
    repository = CanonicalVkCommandRepository(db_session)

    await repository.request_cancellation(cancel_command(first_command))
    await repository.request_cancellation(cancel_command(second_command))

    execution = await db_session.get(VkExecution, first.attachments[0].execution.id)
    collection = await db_session.get(
        VkSourceCollection,
        first.attachments[0].collection.id,
    )
    assert execution.status == "cancelled"
    assert collection.status == "cancelled"
