"""Terminal lifecycle aggregation for canonical TaskRuns."""

from uuid import UUID

from common.events.task_execution_completed import TaskExecutionCompletedPayload
from common.events.task_execution_failed import TaskExecutionFailedPayload
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkTaskRunBinding,
)
from app.infrastructure.db.repositories.canonical_binding_queries import (
    ACTIVE_DEMAND_STATUSES,
    TERMINAL_BINDING_STATUSES,
    refresh_binding,
)
from app.infrastructure.db.repositories.canonical_command_events import (
    EXECUTOR,
    add_outbox,
    utcnow,
)
from app.infrastructure.db.repositories.canonical_command_locks import advisory_lock


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
        refresh_binding(binding, demands)
        if any(d.status in ACTIVE_DEMAND_STATUSES for d in demands):
            if binding.status == "pending":
                binding.status = "running"
            continue
        if binding.status in TERMINAL_BINDING_STATUSES:
            continue
        _emit_terminal(session, binding, demands, worker_id)


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
