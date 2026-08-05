"""Queries and projections shared by canonical TaskRun lifecycle handlers."""

from numbers import Number
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
)
from app.infrastructure.db.repositories.canonical_command_events import utcnow

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


def refresh_binding(binding, demands) -> None:
    binding.completed_demands = sum(d.status == "done" for d in demands)
    binding.failed_demands = sum(d.status == "failed" for d in demands)
    binding.cancelled_demands = sum(d.status == "cancelled" for d in demands)
    binding.processed_items = sum(d.processed_items for d in demands)
    binding.total_items = sum(d.total_items for d in demands)
    binding.stats = merge_stats([dict(d.stats or {}) for d in demands])
    binding.updated_at = utcnow()
