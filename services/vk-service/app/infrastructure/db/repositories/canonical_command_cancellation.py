"""Cancellation of one canonical TaskRun without stopping shared work early."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.source_collections import TaskRunBinding
from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)
from app.infrastructure.db.repositories.canonical_command_entities import binding_entity
from app.infrastructure.db.repositories.canonical_command_events import utcnow
from app.infrastructure.db.repositories.canonical_command_locks import advisory_lock

ACTIVE_STATUSES = ("pending", "running")


async def request_cancellation(
    session: AsyncSession,
    command,
) -> TaskRunBinding | None:
    await advisory_lock(session, f"task:{command.task_id}")
    binding_ref = await session.scalar(
        select(VkTaskRunBinding).where(
            VkTaskRunBinding.command_execution_id == command.execution_id,
            VkTaskRunBinding.task_id == command.task_id,
            VkTaskRunBinding.run_id == str(command.task_run_id),
            VkTaskRunBinding.owner_user_id == command.owner_user_id,
        )
    )
    if binding_ref is None:
        return None

    demand_refs = list(
        (
            await session.scalars(
                select(VkCollectionDemand)
                .where(VkCollectionDemand.binding_id == binding_ref.id)
                .order_by(VkCollectionDemand.id)
            )
        ).all()
    )
    collection_ids = sorted({d.collection_id for d in demand_refs}, key=str)
    collection_refs = list(
        (
            await session.scalars(
                select(VkSourceCollection).where(
                    VkSourceCollection.id.in_(collection_ids)
                )
            )
        ).all()
    )
    execution_ids = sorted({c.execution_id for c in collection_refs}, key=str)

    executions = await _lock_models(session, VkExecution, execution_ids)
    collections = await _lock_models(session, VkSourceCollection, collection_ids)
    demands = await _lock_models(
        session,
        VkCollectionDemand,
        sorted({d.id for d in demand_refs}, key=str),
    )
    binding = await session.scalar(
        select(VkTaskRunBinding)
        .where(VkTaskRunBinding.id == binding_ref.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if binding is None:
        return None
    if binding.status not in ACTIVE_STATUSES:
        return binding_entity(binding)

    now = utcnow()
    safe_reason = command.reason[:2000]
    active_demands = [d for d in demands if d.status in ACTIVE_STATUSES]
    touched_collections = {d.collection_id for d in active_demands}
    for demand in active_demands:
        demand.status = "cancelled"
        demand.cancellation_requested_at = demand.cancellation_requested_at or now
        demand.cancellation_reason = demand.cancellation_reason or safe_reason
        demand.last_error = demand.cancellation_reason
        demand.execution_sequence += 1
        demand.finished_at = now
        demand.updated_at = now
    await session.flush()

    collection_by_id = {model.id: model for model in collections}
    execution_by_id = {model.id: model for model in executions}
    for collection_id in sorted(touched_collections, key=str):
        remaining = int(
            await session.scalar(
                select(func.count(VkCollectionDemand.id)).where(
                    VkCollectionDemand.collection_id == collection_id,
                    VkCollectionDemand.status.in_(ACTIVE_STATUSES),
                )
            )
            or 0
        )
        if remaining:
            continue
        collection = collection_by_id.get(collection_id)
        if collection is None:
            continue
        execution = execution_by_id.get(collection.execution_id)
        if execution is None or execution.status not in ACTIVE_STATUSES:
            continue
        execution.cancellation_requested_at = execution.cancellation_requested_at or now
        execution.cancellation_reason = execution.cancellation_reason or safe_reason
        execution.updated_at = now
        collection.last_error = safe_reason
        collection.updated_at = now
        if execution.status == "pending":
            execution.status = "cancelled"
            execution.finished_at = now
            execution.last_error = safe_reason
            collection.status = "cancelled"
            collection.finished_at = now
        else:
            collection.status = "cancelling"

    binding.status = "cancelled"
    binding.cancellation_requested_at = binding.cancellation_requested_at or now
    binding.cancellation_reason = binding.cancellation_reason or safe_reason
    binding.last_error = binding.cancellation_reason
    binding.completed_demands = sum(d.status == "done" for d in demands)
    binding.failed_demands = sum(d.status == "failed" for d in demands)
    binding.cancelled_demands = sum(d.status == "cancelled" for d in demands)
    binding.execution_sequence += 1
    binding.finished_at = now
    binding.updated_at = now
    await session.flush()
    return binding_entity(binding)


async def _lock_models(session, model, ids):
    if not ids:
        return []
    return list(
        (
            await session.scalars(
                select(model)
                .where(model.id.in_(ids))
                .order_by(model.id)
                .with_for_update()
                .execution_options(populate_existing=True)
            )
        ).all()
    )
