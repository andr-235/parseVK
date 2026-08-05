from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.source_collections import TaskRunBinding
from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)
from app.infrastructure.db.repositories.canonical_commands import _binding_entity

ACTIVE_BINDING_STATUSES = ("pending", "running")
ACTIVE_COLLECTION_STATUSES = ("pending", "running")
ACTIVE_DEMAND_STATUSES = ("pending", "running")


def utcnow() -> datetime:
    return datetime.now(UTC)


class CanonicalCancellationRepository:
    """Cancel TaskRun demands using execution→collection→demand→binding locks."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def request_cancellation(
        self,
        *,
        task_id: int,
        run_id: str,
        execution_id: UUID,
        owner_user_id: str,
        reason: str,
    ) -> TaskRunBinding | None:
        await self._advisory_lock(f"task:{task_id}")
        binding_id = await self.session.scalar(
            select(VkTaskRunBinding.id).where(
                VkTaskRunBinding.task_id == task_id,
                VkTaskRunBinding.run_id == run_id,
                VkTaskRunBinding.command_execution_id == execution_id,
                VkTaskRunBinding.owner_user_id == owner_user_id,
                VkTaskRunBinding.status.in_(ACTIVE_BINDING_STATUSES),
            )
        )
        if binding_id is None:
            return None

        rows = list(
            (
                await self.session.execute(
                    select(
                        VkCollectionDemand.id,
                        VkCollectionDemand.collection_id,
                        VkSourceCollection.execution_id,
                    )
                    .join(
                        VkSourceCollection,
                        VkSourceCollection.id == VkCollectionDemand.collection_id,
                    )
                    .where(
                        VkCollectionDemand.binding_id == binding_id,
                        VkCollectionDemand.status.in_(ACTIVE_DEMAND_STATUSES),
                    )
                    .order_by(
                        VkSourceCollection.execution_id,
                        VkCollectionDemand.collection_id,
                        VkCollectionDemand.id,
                    )
                )
            ).all()
        )

        executions: dict[UUID, VkExecution] = {}
        for physical_execution_id in sorted(
            {row.execution_id for row in rows},
            key=str,
        ):
            model = await self.session.scalar(
                select(VkExecution)
                .where(VkExecution.id == physical_execution_id)
                .with_for_update()
            )
            if model is not None:
                executions[physical_execution_id] = model

        collections: dict[UUID, VkSourceCollection] = {}
        for collection_id in sorted(
            {row.collection_id for row in rows},
            key=str,
        ):
            model = await self.session.scalar(
                select(VkSourceCollection)
                .where(VkSourceCollection.id == collection_id)
                .with_for_update()
            )
            if model is not None:
                collections[collection_id] = model

        demands: list[VkCollectionDemand] = []
        for demand_id in sorted({row.id for row in rows}, key=str):
            model = await self.session.scalar(
                select(VkCollectionDemand)
                .where(VkCollectionDemand.id == demand_id)
                .with_for_update()
            )
            if (
                model is not None
                and model.binding_id == binding_id
                and model.status in ACTIVE_DEMAND_STATUSES
            ):
                demands.append(model)

        binding = await self.session.scalar(
            select(VkTaskRunBinding)
            .where(
                VkTaskRunBinding.id == binding_id,
                VkTaskRunBinding.task_id == task_id,
                VkTaskRunBinding.run_id == run_id,
                VkTaskRunBinding.command_execution_id == execution_id,
                VkTaskRunBinding.owner_user_id == owner_user_id,
                VkTaskRunBinding.status.in_(ACTIVE_BINDING_STATUSES),
            )
            .with_for_update()
        )
        if binding is None:
            return None

        now = utcnow()
        safe_reason = reason[:2000]
        binding.status = "cancelled"
        binding.cancellation_requested_at = binding.cancellation_requested_at or now
        binding.cancellation_reason = binding.cancellation_reason or safe_reason
        binding.last_error = binding.cancellation_reason
        binding.execution_sequence += 1
        binding.finished_at = now
        binding.updated_at = now

        collection_ids: set[UUID] = set()
        for demand in demands:
            demand.status = "cancelled"
            demand.cancellation_requested_at = demand.cancellation_requested_at or now
            demand.cancellation_reason = demand.cancellation_reason or safe_reason
            demand.last_error = demand.cancellation_reason
            demand.execution_sequence += 1
            demand.finished_at = now
            demand.updated_at = now
            collection_ids.add(demand.collection_id)
        binding.cancelled_demands = len(demands)

        for collection_id in sorted(collection_ids, key=str):
            remaining = int(
                await self.session.scalar(
                    select(func.count(VkCollectionDemand.id)).where(
                        VkCollectionDemand.collection_id == collection_id,
                        VkCollectionDemand.status.in_(ACTIVE_DEMAND_STATUSES),
                    )
                )
                or 0
            )
            if remaining:
                continue
            collection = collections.get(collection_id)
            if collection is None:
                continue
            execution = executions.get(collection.execution_id)
            if (
                execution is None
                or execution.status not in ACTIVE_COLLECTION_STATUSES
            ):
                continue
            execution.cancellation_requested_at = (
                execution.cancellation_requested_at or now
            )
            execution.cancellation_reason = (
                execution.cancellation_reason or safe_reason
            )
            execution.updated_at = now
            if execution.status == "pending":
                execution.status = "cancelled"
                execution.finished_at = now
                execution.last_error = safe_reason
                collection.status = "cancelled"
                collection.finished_at = now
                collection.last_error = safe_reason
                collection.updated_at = now

        await self.session.flush()
        return _binding_entity(binding)

    async def _advisory_lock(self, lock_key: str) -> None:
        bind = self.session.get_bind()
        if bind.dialect.name != "postgresql":
            return
        await self.session.execute(
            text("SELECT pg_advisory_xact_lock(hashtext(:lock_key))"),
            {"lock_key": lock_key},
        )
