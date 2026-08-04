"""TaskRun lifecycle aggregation for canonical source executions."""

from numbers import Number
from uuid import UUID

from common.events.task_execution_completed import TaskExecutionCompletedPayload
from common.events.task_execution_failed import TaskExecutionFailedPayload
from common.events.task_execution_progressed import TaskExecutionProgressedPayload
from common.events.task_execution_started import TaskExecutionStartedPayload
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)
from app.infrastructure.db.repositories.canonical_command_events import (
    EXECUTOR,
    add_outbox,
    utcnow,
)
from app.infrastructure.db.repositories.canonical_command_locks import advisory_lock

ACTIVE_DEMAND_STATUSES = ("pending", "running")
TERMINAL_BINDING_STATUSES = ("done", "failed", "cancelled")


def merge_stats(stats_values: list[dict]) -> dict:
    merged: dict = {}
    for stats in stats_values:
        for key, value in (stats or {}).items():
            if isinstance(value, Number) and isinstance(merged.get(key, 0), Number):
                merged[key] = merged.get(key, 0) + value
            elif key not in merged:
                merged[key] = value
    return merged


async def demands_for_execution(
    session: AsyncSession,
    execution_id: UUID,
    *,
    active_only: bool,
) -> list[VkCollectionDemand]:
    stmt = (
        select(VkCollectionDemand)
        .join(
            VkSourceCollection,
            VkSourceCollection.id == VkCollectionDemand.collection_id,
        )
        .where(VkSourceCollection.execution_id == execution_id)
        .order_by(VkCollectionDemand.id)
    )
    if active_only:
        stmt = stmt.where(VkCollectionDemand.status.in_(ACTIVE_DEMAND_STATUSES))
    return list((await session.scalars(stmt)).all())


async def lock_execution_demands(
    session: AsyncSession,
    execution_id: UUID,
) -> list[VkCollectionDemand]:
    execution = await session.scalar(
        select(VkExecution)
        .where(VkExecution.id == execution_id)
        .with_for_update()
    )
    if execution is None:
        return []
    collection = await session.scalar(
        select(VkSourceCollection)
        .where(VkSourceCollection.execution_id == execution_id)
        .with_for_update()
    )
    if collection is None:
        return []
    return list(
        (
            await session.scalars(
                select(VkCollectionDemand)
                .where(
                    VkCollectionDemand.collection_id == collection.id,
                    VkCollectionDemand.status.in_(ACTIVE_DEMAND_STATUSES),
                )
                .order_by(VkCollectionDemand.id)
                .with_for_update()
            )
        ).all()
    )


async def mark_bindings_started(session, demands, attempt) -> None:
    for binding_id in sorted({d.binding_id for d in demands}, key=str):
        await advisory_lock(session, f"binding:{binding_id}")
        binding = await session.scalar(
            select(VkTaskRunBinding)
            .where(VkTaskRunBinding.id == binding_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        if binding is None or binding.status != "pending":
            continue
        now = utcnow()
        binding.status = "running"
        binding.started_at = binding.started_at or now
        binding.execution_sequence += 1
        binding.updated_at = now
        payload = TaskExecutionStartedPayload(
            taskId=binding.task_id,
            runId=binding.run_id,
            ownerUserId=binding.owner_user_id,
            executor=EXECUTOR,
            workerId=attempt.worker_id,
            attempt=attempt.attempt_number,
            executionSequence=binding.execution_sequence,
            providerAccountKey=attempt.provider_account_key,
            credentialVersion=attempt.credential_version,
            startedAt=now.isoformat(),
        )
        add_outbox(
            session,
            event_type="task.execution_started",
            task_id=binding.task_id,
            dedupe_key=f"task.execution_started:{binding.id}",
            payload=payload.model_dump(mode="json", exclude_none=True),
            now=now,
        )


async def finalize_bindings(
    session: AsyncSession,
    binding_ids: set[UUID],
    *,
    worker_id: str,
) -> None:
    for binding_id in sorted(binding_ids, key=str):
        await advisory_lock(session, f"binding:{binding_id}")
        binding = await session.scalar(
            select(VkTaskRunBinding)
            .where(VkTaskRunBinding.id == binding_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        if binding is None:
            continue
        demands = list(
            (
                await session.scalars(
                    select(VkCollectionDemand)
                    .where(VkCollectionDemand.binding_id == binding_id)
                    .order_by(VkCollectionDemand.id)
                )
            ).all()
        )
        _refresh_binding(binding, demands)
        if any(d.status in ACTIVE_DEMAND_STATUSES for d in demands):
            if binding.status == "pending":
                binding.status = "running"
            continue
        if binding.status in TERMINAL_BINDING_STATUSES:
            continue
        _emit_terminal(session, binding, demands, worker_id)


async def report_binding_progress(
    session: AsyncSession,
    *,
    execution_id: UUID,
    processed_items: int,
    total_items: int,
    stats: dict | None,
    occurred_at: str,
) -> int:
    demands = await lock_execution_demands(session, execution_id)
    if not demands:
        return 0
    now = utcnow()
    for demand in demands:
        demand.processed_items = processed_items
        demand.total_items = total_items
        demand.stats = dict(stats or {})
        demand.updated_at = now
    await session.flush()

    emitted = 0
    for binding_id in sorted({d.binding_id for d in demands}, key=str):
        await advisory_lock(session, f"binding:{binding_id}")
        binding = await session.scalar(
            select(VkTaskRunBinding)
            .where(VkTaskRunBinding.id == binding_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        if binding is None or binding.status in TERMINAL_BINDING_STATUSES:
            continue
        all_demands = list(
            (
                await session.scalars(
                    select(VkCollectionDemand).where(
                        VkCollectionDemand.binding_id == binding_id
                    )
                )
            ).all()
        )
        _refresh_binding(binding, all_demands)
        binding.execution_sequence += 1
        binding.updated_at = now
        progress = (
            binding.processed_items / binding.total_items
            if binding.total_items > 0
            else 0.0
        )
        payload = TaskExecutionProgressedPayload(
            taskId=binding.task_id,
            runId=binding.run_id,
            ownerUserId=binding.owner_user_id,
            executor=EXECUTOR,
            executionSequence=binding.execution_sequence,
            processedItems=binding.processed_items,
            totalItems=binding.total_items,
            progress=progress,
            stats=binding.stats,
            occurredAt=occurred_at,
        )
        add_outbox(
            session,
            event_type="task.execution_progressed",
            task_id=binding.task_id,
            dedupe_key=(
                f"task.execution_progressed:{binding.id}:"
                f"{binding.execution_sequence}"
            ),
            payload=payload.model_dump(mode="json"),
            now=now,
        )
        emitted += 1
    return emitted


def _refresh_binding(binding, demands) -> None:
    binding.completed_demands = sum(d.status == "done" for d in demands)
    binding.failed_demands = sum(d.status == "failed" for d in demands)
    binding.cancelled_demands = sum(d.status == "cancelled" for d in demands)
    binding.processed_items = sum(d.processed_items for d in demands)
    binding.total_items = sum(d.total_items for d in demands)
    binding.stats = merge_stats([dict(d.stats or {}) for d in demands])
    binding.updated_at = utcnow()


def _emit_terminal(session, binding, demands, worker_id: str) -> None:
    now = utcnow()
    binding.execution_sequence += 1
    binding.finished_at = now
    if binding.failed_demands:
        binding.status = "failed"
        binding.last_error = next(
            (d.last_error for d in demands if d.status == "failed" and d.last_error),
            "one or more VK source collections failed",
        )
        payload = TaskExecutionFailedPayload(
            taskId=binding.task_id,
            runId=binding.run_id,
            ownerUserId=binding.owner_user_id,
            executor=EXECUTOR,
            workerId=worker_id,
            executionSequence=binding.execution_sequence,
            processedItems=binding.processed_items,
            totalItems=binding.total_items,
            stats=binding.stats,
            error=binding.last_error,
            failureKind="terminal",
            failedAt=now.isoformat(),
        )
        event_type = "task.execution_failed"
    elif binding.cancellation_requested_at is not None or binding.cancelled_demands:
        binding.status = "cancelled"
        binding.last_error = binding.cancellation_reason
        return
    else:
        binding.status = "done"
        binding.last_error = None
        payload = TaskExecutionCompletedPayload(
            taskId=binding.task_id,
            runId=binding.run_id,
            ownerUserId=binding.owner_user_id,
            executor=EXECUTOR,
            workerId=worker_id,
            executionSequence=binding.execution_sequence,
            processedItems=binding.processed_items,
            totalItems=binding.total_items,
            stats=binding.stats,
            completedAt=now.isoformat(),
        )
        event_type = "task.execution_completed"
    add_outbox(
        session,
        event_type=event_type,
        task_id=binding.task_id,
        dedupe_key=f"{event_type}:{binding.id}",
        payload=payload.model_dump(mode="json"),
        now=now,
    )
