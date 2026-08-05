"""Integration tests for canonical TaskRun lifecycle aggregation."""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from sqlalchemy import select

from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.source_collections import VkTaskRunBinding
from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)
from app.infrastructure.db.repositories.canonical_executions import (
    CanonicalExecutionRepository,
)
from canonical_runtime_helpers import attach, cancel_command, make_command, seed_account


@pytest.mark.anyio
async def test_completion_emits_one_terminal_event_per_task_run(db_session):
    await seed_account(db_session)
    source_id = uuid4()
    first = await attach(db_session, make_command(task_id=2010, source_id=source_id))
    second = await attach(db_session, make_command(task_id=2011, source_id=source_id))
    repository = CanonicalExecutionRepository(db_session)

    claim = await repository.claim_next(
        worker_id="canonical-worker",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )
    assert claim is not None
    assert await repository.complete(
        execution_id=claim.execution_id,
        attempt_id=claim.attempt_id,
        fencing_token=claim.fencing_token,
        processed_items=12,
        total_items=12,
        stats={"comments": 12},
    )

    bindings = list(
        (
            await db_session.scalars(
                select(VkTaskRunBinding).order_by(VkTaskRunBinding.task_id)
            )
        ).all()
    )
    assert [binding.status for binding in bindings] == ["done", "done"]
    assert [binding.completed_demands for binding in bindings] == [1, 1]
    terminal_events = list(
        (
            await db_session.scalars(
                select(OutboxEvent)
                .where(OutboxEvent.event_type == "task.execution_completed")
                .order_by(OutboxEvent.aggregate_id)
            )
        ).all()
    )
    assert [event.aggregate_id for event in terminal_events] == ["2010", "2011"]
    assert len({event.dedupe_key for event in terminal_events}) == 2
    assert first.binding.id != second.binding.id


@pytest.mark.anyio
async def test_late_join_receives_started_lifecycle(db_session):
    await seed_account(db_session)
    source_id = uuid4()
    first = await attach(db_session, make_command(task_id=2012, source_id=source_id))
    repository = CanonicalExecutionRepository(db_session)
    claim = await repository.claim_next(
        worker_id="canonical-late-join",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )
    assert claim is not None

    late = await attach(db_session, make_command(task_id=2013, source_id=source_id))

    assert late.attachments[0].outcome == "coalesced"
    assert late.attachments[0].demand.status == "running"
    binding = await db_session.get(VkTaskRunBinding, late.binding.id)
    assert binding.status == "running"
    started = list(
        (
            await db_session.scalars(
                select(OutboxEvent).where(
                    OutboxEvent.event_type == "task.execution_started"
                )
            )
        ).all()
    )
    assert {event.aggregate_id for event in started} == {"2012", "2013"}
    assert first.attachments[0].execution.id == late.attachments[0].execution.id


@pytest.mark.anyio
async def test_cancelled_binding_cannot_be_completed_later(db_session):
    await seed_account(db_session)
    command = make_command(task_id=2014, source_id=uuid4())
    attachment = await attach(db_session, command)
    commands = CanonicalVkCommandRepository(db_session)

    cancelled = await commands.request_cancellation(cancel_command(command))

    assert cancelled is not None and cancelled.status == "cancelled"
    binding = await db_session.get(VkTaskRunBinding, attachment.binding.id)
    assert binding.status == "cancelled"
    terminal_events = list(
        (
            await db_session.scalars(
                select(OutboxEvent).where(
                    OutboxEvent.event_type.in_(
                        ("task.execution_completed", "task.execution_failed")
                    )
                )
            )
        ).all()
    )
    assert terminal_events == []
