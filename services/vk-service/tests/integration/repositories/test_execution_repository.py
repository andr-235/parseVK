from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select

from app.domain.entities.provider_account import SYSTEM_VK_CAPABILITY
from app.domain.repositories.checkpoint import CheckpointData
from app.infrastructure.db.models.executions import VkExecutionAttempt
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.repositories.checkpoint import SqlAlchemyIngestionCheckpointStore
from app.infrastructure.db.repositories.executions import SqlAlchemyExecutionRepository
from app.infrastructure.db.repositories.provider_accounts import (
    SqlAlchemyProviderAccountRepository,
)
from app.infrastructure.db.repositories.tasks import SqlAlchemyTaskEventsRepository


async def _seed_account(db_session, *, status="active", capabilities=None):
    repo = SqlAlchemyProviderAccountRepository(db_session)
    account = await repo.upsert_system(
        account_key="system-vk",
        provider="vk",
        credential_version="seed-v1",
        capabilities=(
            [SYSTEM_VK_CAPABILITY] if capabilities is None else capabilities
        ),
    )
    if status == "invalid":
        await repo.transition_to_invalid(
            account.id,
            "seed-v1",
            error_code=8,
            error_kind="auth",
        )
    return account


async def _create_execution(db_session, *, task_id, run_id):
    return await SqlAlchemyTaskEventsRepository(db_session).create_execution(
        task_id=task_id,
        owner_user_id="user-1",
        run_id=run_id,
        scope="selected",
        mode="recent_posts",
        group_ids=[1],
        post_limit=10,
        plan_snapshot={"groupIds": [1], "postLimit": 10},
        parent_execution_id=None,
    )


@pytest.mark.anyio
async def test_expired_attempt_is_replaced_with_higher_fence(db_session):
    await _seed_account(db_session)
    execution = await _create_execution(
        db_session, task_id=900, run_id="run-900"
    )
    repository = SqlAlchemyExecutionRepository(db_session)

    first = await repository.claim_next(
        worker_id="same-worker",
        lease_expires_at=datetime.now(UTC) - timedelta(seconds=1),
    )
    second = await repository.claim_next(
        worker_id="same-worker",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )

    assert first is not None and second is not None
    assert first.execution_id == execution.id == second.execution_id
    assert first.attempt_id != second.attempt_id
    assert first.fencing_token == 1
    assert second.fencing_token == 2
    assert second.attempt_number == 2

    attempts = (
        await db_session.scalars(
            select(VkExecutionAttempt).order_by(VkExecutionAttempt.attempt_number)
        )
    ).all()
    assert [attempt.status for attempt in attempts] == ["expired", "running"]


@pytest.mark.anyio
async def test_stale_attempt_cannot_heartbeat_or_complete(db_session):
    await _seed_account(db_session)
    await _create_execution(db_session, task_id=901, run_id="run-901")
    repository = SqlAlchemyExecutionRepository(db_session)
    first = await repository.claim_next(
        worker_id="same-worker",
        lease_expires_at=datetime.now(UTC) - timedelta(seconds=1),
    )
    second = await repository.claim_next(
        worker_id="same-worker",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )
    assert first is not None and second is not None

    assert not await repository.renew(
        execution_id=first.execution_id,
        attempt_id=first.attempt_id,
        fencing_token=first.fencing_token,
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=2),
    )
    assert not await repository.complete(
        execution_id=first.execution_id,
        attempt_id=first.attempt_id,
        fencing_token=first.fencing_token,
        processed_items=99,
        total_items=99,
    )
    assert await repository.complete(
        execution_id=second.execution_id,
        attempt_id=second.attempt_id,
        fencing_token=second.fencing_token,
        processed_items=12,
        total_items=12,
    )

    terminal_events = (
        await db_session.scalars(
            select(OutboxEvent).where(
                OutboxEvent.event_type == "task.execution_completed"
            )
        )
    ).all()
    assert len(terminal_events) == 1


@pytest.mark.anyio
async def test_crash_recovery_reuses_checkpoint_and_emits_one_terminal_event(db_session):
    await _seed_account(db_session)
    await _create_execution(db_session, task_id=905, run_id="run-905")
    repository = SqlAlchemyExecutionRepository(db_session)
    checkpoint_store = SqlAlchemyIngestionCheckpointStore(db_session)

    first = await repository.claim_next(
        worker_id="worker-before-crash",
        lease_expires_at=datetime.now(UTC) - timedelta(seconds=1),
    )
    assert first is not None
    await checkpoint_store.save(
        CheckpointData(
            run_id=first.run_id,
            owner_id=-1,
            post_id=10,
            task_id=first.task_id,
            group_id=1,
            next_offset=200,
            processed_comments=200,
            status="in_progress",
        )
    )
    await db_session.flush()

    second = await repository.claim_next(
        worker_id="worker-after-crash",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )
    assert second is not None
    checkpoint = await checkpoint_store.load(second.run_id, -1, 10)

    assert second.execution_id == first.execution_id
    assert second.attempt_number == first.attempt_number + 1
    assert checkpoint is not None
    assert checkpoint.next_offset == 200
    assert checkpoint.processed_comments == 200
    assert not await repository.complete(
        execution_id=first.execution_id,
        attempt_id=first.attempt_id,
        fencing_token=first.fencing_token,
        processed_items=999,
        total_items=999,
    )
    assert await repository.complete(
        execution_id=second.execution_id,
        attempt_id=second.attempt_id,
        fencing_token=second.fencing_token,
        processed_items=250,
        total_items=250,
    )
    terminal_events = (
        await db_session.scalars(
            select(OutboxEvent).where(
                OutboxEvent.event_type == "task.execution_completed",
                OutboxEvent.aggregate_id == "905",
            )
        )
    ).all()
    assert len(terminal_events) == 1


@pytest.mark.anyio
async def test_cancellation_is_durable_and_stops_heartbeat(db_session):
    await _seed_account(db_session)
    execution = await _create_execution(
        db_session, task_id=902, run_id="run-902"
    )
    repository = SqlAlchemyExecutionRepository(db_session)
    claim = await repository.claim_next(
        worker_id="worker-1",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )
    assert claim is not None

    events = SqlAlchemyTaskEventsRepository(db_session)
    requested = await events.request_cancellation(
        task_id=902,
        run_id="run-902",
        reason="task.cancelled",
    )
    repeated = await events.request_cancellation(
        task_id=902,
        run_id="run-902",
        reason="task.cancelled",
    )

    assert requested is not None and repeated is not None
    assert requested.cancellation_requested_at == repeated.cancellation_requested_at
    assert not await repository.renew(
        execution_id=execution.id,
        attempt_id=claim.attempt_id,
        fencing_token=claim.fencing_token,
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=2),
    )
    assert await repository.cancel(
        execution_id=execution.id,
        attempt_id=claim.attempt_id,
        fencing_token=claim.fencing_token,
    )


@pytest.mark.anyio
async def test_terminal_execution_is_never_reclaimed(db_session):
    await _seed_account(db_session)
    await _create_execution(db_session, task_id=903, run_id="run-903")
    repository = SqlAlchemyExecutionRepository(db_session)
    claim = await repository.claim_next(
        worker_id="worker-1",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )
    assert claim is not None
    assert await repository.complete(
        execution_id=claim.execution_id,
        attempt_id=claim.attempt_id,
        fencing_token=claim.fencing_token,
        processed_items=1,
        total_items=1,
    )

    assert (
        await repository.claim_next(
            worker_id="worker-2",
            lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
        )
        is None
    )


@pytest.mark.anyio
async def test_claim_is_blocked_for_invalid_provider(db_session):
    await _seed_account(db_session, status="invalid")
    await _create_execution(db_session, task_id=904, run_id="run-904")

    assert (
        await SqlAlchemyExecutionRepository(db_session).claim_next(
            worker_id="worker-1",
            lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
        )
        is None
    )
