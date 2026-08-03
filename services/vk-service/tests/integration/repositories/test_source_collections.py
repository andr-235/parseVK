from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import func, select

from app.domain.entities.provider_account import SYSTEM_VK_CAPABILITY
from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
)
from app.infrastructure.db.repositories.executions import (
    SqlAlchemyExecutionRepository,
)
from app.infrastructure.db.repositories.provider_accounts import (
    SqlAlchemyProviderAccountRepository,
)
from app.infrastructure.db.repositories.source_collections import (
    SqlAlchemySourceCollectionRepository,
)
from app.services.collection_fingerprint import build_collection_identity


async def _attach(
    db_session,
    *,
    task_id: int,
    run_id: str,
    group_ids: list[int] | None = None,
    post_limit: int = 10,
):
    group_ids = group_ids or [1]
    identity = build_collection_identity(
        provider_account_key="system-vk",
        scope="selected",
        mode="recent_posts",
        group_ids=group_ids,
        post_limit=post_limit,
        payload={},
    )
    return await SqlAlchemySourceCollectionRepository(db_session).attach_demand(
        task_id=task_id,
        owner_user_id=f"user-{task_id}",
        run_id=run_id,
        provider_account_key=identity.provider_account_key,
        source_key=identity.source_key,
        fingerprint=identity.fingerprint,
        scope="selected",
        mode="recent_posts",
        group_ids=identity.normalized_plan["groupIds"],
        post_limit=post_limit,
        plan_snapshot=identity.normalized_plan,
    )


async def _seed_account(db_session):
    await SqlAlchemyProviderAccountRepository(db_session).upsert_system(
        account_key="system-vk",
        provider="vk",
        credential_version="version-1",
        capabilities=[SYSTEM_VK_CAPABILITY],
    )


@pytest.mark.anyio
async def test_exact_demands_share_one_physical_execution(db_session):
    first = await _attach(db_session, task_id=1001, run_id="run-1001")
    second = await _attach(db_session, task_id=1002, run_id="run-1002")

    assert first is not None and second is not None
    assert first.collection_created is True
    assert second.collection_created is False
    assert first.collection.id == second.collection.id
    assert first.execution.id == second.execution.id
    assert await db_session.scalar(select(func.count(VkSourceCollection.id))) == 1
    assert await db_session.scalar(select(func.count(VkExecution.id))) == 1
    assert await db_session.scalar(select(func.count(VkCollectionDemand.id))) == 2


@pytest.mark.anyio
async def test_plan_mismatch_does_not_coalesce(db_session):
    first = await _attach(
        db_session,
        task_id=1003,
        run_id="run-1003",
        post_limit=10,
    )
    second = await _attach(
        db_session,
        task_id=1004,
        run_id="run-1004",
        post_limit=20,
    )

    assert first is not None and second is not None
    assert first.collection.id != second.collection.id
    assert first.execution.id != second.execution.id


@pytest.mark.anyio
async def test_cancelling_one_demand_keeps_shared_collection_active(db_session):
    first = await _attach(db_session, task_id=1005, run_id="run-1005")
    second = await _attach(db_session, task_id=1006, run_id="run-1006")
    assert first is not None and second is not None
    repository = SqlAlchemySourceCollectionRepository(db_session)

    cancelled = await repository.request_cancellation(
        task_id=1005,
        run_id="run-1005",
        reason="task.cancelled",
    )

    assert cancelled is not None
    assert cancelled.status == "cancelled"
    execution = await db_session.get(VkExecution, first.execution.id)
    collection = await db_session.get(VkSourceCollection, first.collection.id)
    remaining = await repository.get_demand(task_id=1006, run_id="run-1006")
    assert execution.status == "pending"
    assert execution.cancellation_requested_at is None
    assert collection.status == "pending"
    assert remaining is not None and remaining.status == "pending"


@pytest.mark.anyio
async def test_last_cancelled_demand_cancels_pending_collection(db_session):
    first = await _attach(db_session, task_id=1007, run_id="run-1007")
    second = await _attach(db_session, task_id=1008, run_id="run-1008")
    assert first is not None and second is not None
    repository = SqlAlchemySourceCollectionRepository(db_session)

    await repository.request_cancellation(
        task_id=1007,
        run_id="run-1007",
        reason="task.cancelled",
    )
    await repository.request_cancellation(
        task_id=1008,
        run_id="run-1008",
        reason="task.cancelled",
    )

    execution = await db_session.get(VkExecution, first.execution.id)
    collection = await db_session.get(VkSourceCollection, first.collection.id)
    assert execution.status == "cancelled"
    assert collection.status == "cancelled"


@pytest.mark.anyio
async def test_late_demand_gets_started_for_current_attempt(db_session):
    await _seed_account(db_session)
    first = await _attach(db_session, task_id=1013, run_id="run-1013")
    assert first is not None
    execution_repository = SqlAlchemyExecutionRepository(db_session)
    claim = await execution_repository.claim_next(
        worker_id="worker-late-join",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )
    assert claim is not None

    late = await _attach(db_session, task_id=1014, run_id="run-1014")

    assert late is not None
    assert late.collection_created is False
    assert late.collection.id == first.collection.id
    assert late.demand.status == "running"
    assert late.demand.execution_sequence == 1
    started_events = (
        await db_session.scalars(
            select(OutboxEvent)
            .where(OutboxEvent.event_type == "task.execution_started")
            .order_by(OutboxEvent.aggregate_id)
        )
    ).all()
    assert [event.aggregate_id for event in started_events] == ["1013", "1014"]


@pytest.mark.anyio
async def test_completion_is_fanned_out_to_each_active_demand(db_session):
    await _seed_account(db_session)
    first = await _attach(db_session, task_id=1009, run_id="run-1009")
    second = await _attach(db_session, task_id=1010, run_id="run-1010")
    assert first is not None and second is not None
    repository = SqlAlchemyExecutionRepository(db_session)

    claim = await repository.claim_next(
        worker_id="worker-1",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )
    assert claim is not None
    assert claim.execution_id == first.execution.id
    assert await repository.complete(
        execution_id=claim.execution_id,
        attempt_id=claim.attempt_id,
        fencing_token=claim.fencing_token,
        processed_items=12,
        total_items=12,
        stats={"comments": 12},
    )

    demands = (
        await db_session.scalars(
            select(VkCollectionDemand).order_by(VkCollectionDemand.task_id)
        )
    ).all()
    assert [demand.status for demand in demands] == ["done", "done"]
    collection = await db_session.get(VkSourceCollection, first.collection.id)
    assert collection.status == "done"
    terminal_events = (
        await db_session.scalars(
            select(OutboxEvent)
            .where(OutboxEvent.event_type == "task.execution_completed")
            .order_by(OutboxEvent.aggregate_id)
        )
    ).all()
    assert [event.aggregate_id for event in terminal_events] == ["1009", "1010"]


@pytest.mark.anyio
async def test_shared_failure_is_attributed_to_each_active_demand(db_session):
    await _seed_account(db_session)
    first = await _attach(db_session, task_id=1011, run_id="run-1011")
    second = await _attach(db_session, task_id=1012, run_id="run-1012")
    assert first is not None and second is not None
    repository = SqlAlchemyExecutionRepository(db_session)

    claim = await repository.claim_next(
        worker_id="worker-1",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )
    assert claim is not None
    assert await repository.fail(
        execution_id=claim.execution_id,
        attempt_id=claim.attempt_id,
        fencing_token=claim.fencing_token,
        error="shared source failed",
    )

    demands = (
        await db_session.scalars(
            select(VkCollectionDemand).order_by(VkCollectionDemand.task_id)
        )
    ).all()
    assert [demand.status for demand in demands] == ["failed", "failed"]
    assert {demand.last_error for demand in demands} == {"shared source failed"}
    terminal_events = (
        await db_session.scalars(
            select(OutboxEvent).where(
                OutboxEvent.event_type == "task.execution_failed"
            )
        )
    ).all()
    assert {event.aggregate_id for event in terminal_events} == {"1011", "1012"}
