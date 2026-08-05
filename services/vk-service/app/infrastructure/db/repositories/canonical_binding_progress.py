"""Progress aggregation for canonical TaskRuns."""

from uuid import UUID

from common.events.task_execution_progressed import TaskExecutionProgressedPayload
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkTaskRunBinding,
)
from app.infrastructure.db.repositories.canonical_binding_queries import (
    TERMINAL_BINDING_STATUSES,
    lock_execution_demands,
    refresh_binding,
)
from app.infrastructure.db.repositories.canonical_command_events import (
    EXECUTOR,
    add_outbox,
    utcnow,
)
from app.infrastructure.db.repositories.canonical_command_locks import advisory_lock


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
        refresh_binding(binding, all_demands)
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
