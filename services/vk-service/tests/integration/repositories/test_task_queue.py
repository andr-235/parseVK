from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select

from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.repositories.provider_accounts import (
    SqlAlchemyProviderAccountRepository,
)
from app.infrastructure.db.repositories.task_queue import SqlAlchemyTaskQueueRepository
from app.infrastructure.db.repositories.tasks import SqlAlchemyTaskEventsRepository


async def _seed_account(db_session, *, status="active", cooldown_until=None):
    repo = SqlAlchemyProviderAccountRepository(db_session)
    account = await repo.upsert_system(
        account_key="system-vk",
        provider="vk",
        credential_version="seed-v1",
    )
    if status == "invalid":
        await repo.transition_to_invalid(
            account.id,
            "seed-v1",
            error_code=8,
            error_kind="auth",
        )
    elif cooldown_until is not None:
        await repo.set_cooldown(account.id, cooldown_until)
    return account


async def _create_task(db_session, *, task_id, run_id):
    events = SqlAlchemyTaskEventsRepository(db_session)
    await events.create_task_run(
        task_id=task_id,
        owner_user_id="user-1",
        run_id=run_id,
        scope="selected",
        mode="recent_posts",
        group_ids=[1],
        post_limit=10,
    )


@pytest.mark.anyio
async def test_task_queue_claim_renew_and_complete(db_session):
    await _seed_account(db_session)
    await _create_task(db_session, task_id=900, run_id="run-900")
    queue = SqlAlchemyTaskQueueRepository(db_session)

    claimed = await queue.claim_next(
        worker_id="worker-1",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )

    assert claimed is not None
    assert claimed.task_id == 900
    assert claimed.status == "running"
    assert claimed.attempts == 1
    assert claimed.provider_account_key == "system-vk"
    assert claimed.credential_version == "seed-v1"

    started = await db_session.scalar(
        select(OutboxEvent).where(
            OutboxEvent.event_type == "task.execution_started",
            OutboxEvent.aggregate_id == "900",
        )
    )
    assert started is not None
    assert started.payload["providerAccountKey"] == "system-vk"
    assert started.payload["credentialVersion"] == "seed-v1"

    assert await queue.renew_lease(
        task_id=900,
        run_id="run-900",
        worker_id="worker-1",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=2),
    )
    assert await queue.mark_done(
        task_id=900,
        run_id="run-900",
        worker_id="worker-1",
        processed_items=12,
        total_items=12,
    )

    completed = await SqlAlchemyTaskEventsRepository(db_session).get_task_run(900)
    assert completed is not None
    assert completed.status == "done"
    assert completed.lease_owner is None


@pytest.mark.anyio
async def test_expired_running_task_is_reclaimed(db_session):
    await _seed_account(db_session)
    await _create_task(db_session, task_id=901, run_id="run-901")
    queue = SqlAlchemyTaskQueueRepository(db_session)
    first = await queue.claim_next(
        worker_id="dead-worker",
        lease_expires_at=datetime.now(UTC) - timedelta(seconds=1),
    )
    assert first is not None

    recovered = await queue.claim_next(
        worker_id="new-worker",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )

    assert recovered is not None
    assert recovered.task_id == 901
    assert recovered.attempts == 2
    assert recovered.lease_owner == "new-worker"
    assert recovered.credential_version == "seed-v1"


@pytest.mark.anyio
async def test_claim_returns_none_when_account_invalid(db_session):
    await _seed_account(db_session, status="invalid")
    await _create_task(db_session, task_id=902, run_id="run-902")
    queue = SqlAlchemyTaskQueueRepository(db_session)

    claimed = await queue.claim_next(
        worker_id="worker-1",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )

    assert claimed is None


@pytest.mark.anyio
async def test_claim_returns_none_when_account_cooling_down(db_session):
    await _seed_account(
        db_session,
        cooldown_until=datetime.now(UTC) + timedelta(hours=1),
    )
    await _create_task(db_session, task_id=903, run_id="run-903")
    queue = SqlAlchemyTaskQueueRepository(db_session)

    claimed = await queue.claim_next(
        worker_id="worker-1",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )

    assert claimed is None


@pytest.mark.anyio
async def test_claim_returns_none_while_cooling_down_until_reconciliation(
    db_session,
):
    await _seed_account(
        db_session,
        cooldown_until=datetime.now(UTC) - timedelta(seconds=5),
    )
    await _create_task(db_session, task_id=904, run_id="run-904")
    queue = SqlAlchemyTaskQueueRepository(db_session)

    claimed = await queue.claim_next(
        worker_id="worker-1",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )

    assert claimed is None


@pytest.mark.anyio
async def test_claim_returns_none_without_account_row(db_session):
    await _create_task(db_session, task_id=905, run_id="run-905")
    queue = SqlAlchemyTaskQueueRepository(db_session)

    claimed = await queue.claim_next(
        worker_id="worker-1",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )

    assert claimed is None
