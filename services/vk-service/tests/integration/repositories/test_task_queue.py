from datetime import UTC, datetime, timedelta

import pytest
from app.infrastructure.db.repositories.task_queue import SqlAlchemyTaskQueueRepository
from app.infrastructure.db.repositories.tasks import SqlAlchemyTaskEventsRepository


@pytest.mark.anyio
async def test_task_queue_claim_renew_and_complete(db_session):
    events = SqlAlchemyTaskEventsRepository(db_session)
    queue = SqlAlchemyTaskQueueRepository(db_session)
    await events.create_task_run(
        task_id=900,
        owner_user_id="user-1",
        run_id="run-900",
        scope="selected",
        mode="recent_posts",
        group_ids=[1],
        post_limit=10,
    )

    claimed = await queue.claim_next(
        worker_id="worker-1",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )

    assert claimed is not None
    assert claimed.task_id == 900
    assert claimed.status == "running"
    assert claimed.attempts == 1
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

    completed = await events.get_task_run(900)
    assert completed is not None
    assert completed.status == "done"
    assert completed.lease_owner is None


@pytest.mark.anyio
async def test_expired_running_task_is_reclaimed(db_session):
    events = SqlAlchemyTaskEventsRepository(db_session)
    queue = SqlAlchemyTaskQueueRepository(db_session)
    await events.create_task_run(
        task_id=901,
        owner_user_id="user-1",
        run_id="run-901",
        scope="selected",
        mode="recent_posts",
        group_ids=[1],
    )
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
