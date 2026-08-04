from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import exists, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.source_collections import CollectionDemand, TaskRunBinding
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)

ACTIVE_DEMAND_STATUSES = ("pending", "running")


def _as_utc(value: datetime | None) -> datetime | None:
    if value is None or value.tzinfo is not None:
        return value
    return value.replace(tzinfo=UTC)


def _demand_entity(model: VkCollectionDemand) -> CollectionDemand:
    return CollectionDemand(
        id=model.id,
        demand_id=model.demand_id,
        binding_id=model.binding_id,
        collection_id=model.collection_id,
        source_id=model.source_id,
        task_id=model.task_id,
        run_id=model.run_id,
        owner_user_id=model.owner_user_id,
        task_revision=model.task_revision,
        source_set_revision=model.source_set_revision,
        snapshot_sha256=model.snapshot_sha256,
        status=model.status,
        execution_sequence=model.execution_sequence,
        processed_items=model.processed_items,
        total_items=model.total_items,
        stats=dict(model.stats or {}),
        cancellation_requested_at=_as_utc(model.cancellation_requested_at),
        cancellation_reason=model.cancellation_reason,
        last_error=model.last_error,
        created_at=_as_utc(model.created_at),
        updated_at=_as_utc(model.updated_at),
        finished_at=_as_utc(model.finished_at),
    )


def _binding_entity(model: VkTaskRunBinding) -> TaskRunBinding:
    return TaskRunBinding(
        id=model.id,
        command_execution_id=model.command_execution_id,
        task_id=model.task_id,
        run_id=model.run_id,
        owner_user_id=model.owner_user_id,
        task_revision=model.task_revision,
        source_set_revision=model.source_set_revision,
        snapshot_sha256=model.snapshot_sha256,
        expected_demands=model.expected_demands,
        completed_demands=model.completed_demands,
        failed_demands=model.failed_demands,
        cancelled_demands=model.cancelled_demands,
        processed_items=model.processed_items,
        total_items=model.total_items,
        stats=dict(model.stats or {}),
        status=model.status,
        execution_sequence=model.execution_sequence,
        cancellation_requested_at=_as_utc(model.cancellation_requested_at),
        cancellation_reason=model.cancellation_reason,
        last_error=model.last_error,
        started_at=_as_utc(model.started_at),
        finished_at=_as_utc(model.finished_at),
        created_at=_as_utc(model.created_at),
        updated_at=_as_utc(model.updated_at),
    )


class SqlAlchemySourceCollectionRepository:
    """Read model for canonical source collections and TaskRun bindings."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_active_demands(self, execution_id: UUID) -> list[CollectionDemand]:
        models = list(
            (
                await self.session.scalars(
                    select(VkCollectionDemand)
                    .join(
                        VkSourceCollection,
                        VkSourceCollection.id == VkCollectionDemand.collection_id,
                    )
                    .where(
                        VkSourceCollection.execution_id == execution_id,
                        VkCollectionDemand.status.in_(ACTIVE_DEMAND_STATUSES),
                    )
                    .order_by(VkCollectionDemand.created_at, VkCollectionDemand.id)
                )
            ).all()
        )
        return [_demand_entity(model) for model in models]

    async def has_collection(self, execution_id: UUID) -> bool:
        return bool(
            await self.session.scalar(
                select(
                    exists().where(
                        VkSourceCollection.execution_id == execution_id
                    )
                )
            )
        )

    async def get_demand(self, demand_id: UUID) -> CollectionDemand | None:
        model = await self.session.scalar(
            select(VkCollectionDemand).where(
                VkCollectionDemand.demand_id == demand_id
            )
        )
        return _demand_entity(model) if model is not None else None

    async def get_binding(
        self,
        *,
        task_id: int,
        run_id: str,
    ) -> TaskRunBinding | None:
        model = await self.session.scalar(
            select(VkTaskRunBinding).where(
                VkTaskRunBinding.task_id == task_id,
                VkTaskRunBinding.run_id == run_id,
            )
        )
        return _binding_entity(model) if model is not None else None
