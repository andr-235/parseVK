from datetime import UTC, datetime
from uuid import UUID, uuid4

from common.events.task_execution_started import TaskExecutionStartedPayload
from sqlalchemy import desc, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.executions import TERMINAL_EXECUTION_STATUSES
from app.domain.entities.source_collections import (
    CollectionDemand,
    DemandAttachment,
    SourceCollection,
)
from app.infrastructure.db.models.executions import VkExecution, VkExecutionAttempt
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
)
from app.infrastructure.db.repositories.executions import _execution_entity

ACTIVE_COLLECTION_STATUSES = ("pending", "running")
ACTIVE_DEMAND_STATUSES = ("pending", "running")
EXECUTOR = "vk-service"


def utcnow() -> datetime:
    return datetime.now(UTC)


def _as_utc(value: datetime | None) -> datetime | None:
    if value is None or value.tzinfo is not None:
        return value
    return value.replace(tzinfo=UTC)


def _collection_entity(model: VkSourceCollection) -> SourceCollection:
    return SourceCollection(
        id=model.id,
        execution_id=model.execution_id,
        provider_account_key=model.provider_account_key,
        source_key=model.source_key,
        fingerprint=model.fingerprint,
        status=model.status,
        plan_snapshot=dict(model.plan_snapshot or {}),
        started_at=_as_utc(model.started_at),
        finished_at=_as_utc(model.finished_at),
        last_error=model.last_error,
        created_at=_as_utc(model.created_at),
        updated_at=_as_utc(model.updated_at),
    )


def _demand_entity(model: VkCollectionDemand) -> CollectionDemand:
    return CollectionDemand(
        id=model.id,
        collection_id=model.collection_id,
        task_id=model.task_id,
        run_id=model.run_id,
        owner_user_id=model.owner_user_id,
        status=model.status,
        execution_sequence=model.execution_sequence,
        cancellation_requested_at=_as_utc(model.cancellation_requested_at),
        cancellation_reason=model.cancellation_reason,
        last_error=model.last_error,
        created_at=_as_utc(model.created_at),
        updated_at=_as_utc(model.updated_at),
        finished_at=_as_utc(model.finished_at),
    )


class SqlAlchemySourceCollectionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def attach_demand(
        self,
        *,
        task_id: int,
        owner_user_id: str,
        run_id: str,
        provider_account_key: str,
        source_key: str,
        fingerprint: str,
        scope: str,
        mode: str,
        group_ids: list[int],
        post_limit: int | None,
        plan_snapshot: dict,
    ) -> DemandAttachment | None:
        await self._lock_task(task_id)
        await self._lock_identity(provider_account_key, source_key, fingerprint)

        existing = await self.session.scalar(
            select(VkCollectionDemand.id).where(
                VkCollectionDemand.task_id == task_id,
                VkCollectionDemand.run_id == run_id,
            )
        )
        if existing is not None:
            return None

        active_for_task = await self.session.scalar(
            select(VkCollectionDemand.id).where(
                VkCollectionDemand.task_id == task_id,
                VkCollectionDemand.status.in_(ACTIVE_DEMAND_STATUSES),
            )
        )
        if active_for_task is not None:
            return None

        candidate = await self.session.scalar(
            select(VkSourceCollection)
            .where(
                VkSourceCollection.provider_account_key == provider_account_key,
                VkSourceCollection.source_key == source_key,
                VkSourceCollection.fingerprint == fingerprint,
                VkSourceCollection.status.in_(ACTIVE_COLLECTION_STATUSES),
            )
            .order_by(VkSourceCollection.created_at)
            .limit(1)
        )
        collection = None
        execution = None
        if candidate is not None:
            execution = await self.session.scalar(
                select(VkExecution)
                .where(VkExecution.id == candidate.execution_id)
                .with_for_update()
            )
            collection = await self.session.scalar(
                select(VkSourceCollection)
                .where(VkSourceCollection.id == candidate.id)
                .with_for_update()
            )
            if (
                execution is None
                or collection is None
                or execution.status not in ACTIVE_COLLECTION_STATUSES
                or collection.status not in ACTIVE_COLLECTION_STATUSES
            ):
                execution = None
                collection = None

        collection_created = collection is None
        if collection is None:
            latest_execution = await self.session.scalar(
                select(VkExecution)
                .where(VkExecution.task_id == task_id)
                .order_by(desc(VkExecution.created_at))
                .limit(1)
            )
            execution = VkExecution(
                task_id=task_id,
                owner_user_id=owner_user_id,
                run_id=run_id,
                status="pending",
                scope=scope,
                mode=mode,
                group_ids=group_ids,
                post_limit=post_limit,
                plan_snapshot=plan_snapshot,
                parent_execution_id=(
                    latest_execution.id
                    if latest_execution is not None
                    and latest_execution.status in TERMINAL_EXECUTION_STATUSES
                    else None
                ),
            )
            self.session.add(execution)
            await self.session.flush()

            collection = VkSourceCollection(
                execution_id=execution.id,
                provider_account_key=provider_account_key,
                source_key=source_key,
                fingerprint=fingerprint,
                status="pending",
                plan_snapshot=plan_snapshot,
            )
            self.session.add(collection)
            await self.session.flush()

        if execution is None:
            raise RuntimeError(f"source collection {collection.id} has no execution")

        joining_running = (
            execution.status == "running" and collection.status == "running"
        )
        demand = VkCollectionDemand(
            collection_id=collection.id,
            task_id=task_id,
            run_id=run_id,
            owner_user_id=owner_user_id,
            status="running" if joining_running else "pending",
            execution_sequence=1 if joining_running else 0,
        )
        self.session.add(demand)
        await self.session.flush()

        if joining_running:
            await self._emit_late_join_started(execution, demand)

        return DemandAttachment(
            collection=_collection_entity(collection),
            demand=_demand_entity(demand),
            execution=_execution_entity(execution),
            collection_created=collection_created,
        )

    async def request_cancellation(
        self,
        *,
        task_id: int,
        run_id: str | None,
        reason: str,
    ) -> CollectionDemand | None:
        await self._lock_task(task_id)
        context = await self._lock_demand_context(
            task_id=task_id,
            run_id=run_id,
            statuses=ACTIVE_DEMAND_STATUSES,
        )
        if context is None:
            return None
        execution, collection, demand = context

        now = utcnow()
        demand.status = "cancelled"
        demand.cancellation_requested_at = demand.cancellation_requested_at or now
        demand.cancellation_reason = demand.cancellation_reason or reason[:2000]
        demand.last_error = demand.cancellation_reason
        demand.execution_sequence += 1
        demand.finished_at = now
        demand.updated_at = now
        await self.session.flush()

        remaining = await self.session.scalar(
            select(func.count(VkCollectionDemand.id)).where(
                VkCollectionDemand.collection_id == demand.collection_id,
                VkCollectionDemand.status.in_(ACTIVE_DEMAND_STATUSES),
            )
        )
        if (
            int(remaining or 0) == 0
            and execution.status not in TERMINAL_EXECUTION_STATUSES
        ):
            execution.cancellation_requested_at = (
                execution.cancellation_requested_at or now
            )
            execution.cancellation_reason = (
                execution.cancellation_reason or reason[:2000]
            )
            execution.updated_at = now
            if execution.status == "pending":
                execution.status = "cancelled"
                execution.finished_at = now
                execution.last_error = reason[:2000]
                collection.status = "cancelled"
                collection.finished_at = now
                collection.last_error = reason[:2000]
                collection.updated_at = now
        await self.session.flush()
        return _demand_entity(demand)

    async def fail_pending_demand(
        self,
        *,
        task_id: int,
        run_id: str,
        error: str,
    ) -> bool:
        await self._lock_task(task_id)
        context = await self._lock_demand_context(
            task_id=task_id,
            run_id=run_id,
            statuses=("pending",),
        )
        if context is None:
            return False
        execution, collection, demand = context

        now = utcnow()
        safe_error = error[:2000]
        demand.status = "failed"
        demand.last_error = safe_error
        demand.finished_at = now
        demand.execution_sequence += 1
        demand.updated_at = now
        await self.session.flush()

        remaining = await self.session.scalar(
            select(func.count(VkCollectionDemand.id)).where(
                VkCollectionDemand.collection_id == demand.collection_id,
                VkCollectionDemand.status.in_(ACTIVE_DEMAND_STATUSES),
            )
        )
        if int(remaining or 0) == 0 and execution.status == "pending":
            execution.status = "failed"
            execution.last_error = safe_error
            execution.finished_at = now
            execution.updated_at = now
            collection.status = "failed"
            collection.last_error = safe_error
            collection.finished_at = now
            collection.updated_at = now
        await self.session.flush()
        return True

    async def list_active_demands(self, execution_id: UUID) -> list[CollectionDemand]:
        models = (
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
        return [_demand_entity(model) for model in models]

    async def get_demand(
        self, *, task_id: int, run_id: str
    ) -> CollectionDemand | None:
        model = await self.session.scalar(
            select(VkCollectionDemand).where(
                VkCollectionDemand.task_id == task_id,
                VkCollectionDemand.run_id == run_id,
            )
        )
        return _demand_entity(model) if model is not None else None

    async def _lock_demand_context(
        self,
        *,
        task_id: int,
        run_id: str | None,
        statuses: tuple[str, ...],
    ) -> tuple[VkExecution, VkSourceCollection, VkCollectionDemand] | None:
        demand_stmt = select(VkCollectionDemand).where(
            VkCollectionDemand.task_id == task_id,
            VkCollectionDemand.status.in_(statuses),
        )
        if run_id:
            demand_stmt = demand_stmt.where(VkCollectionDemand.run_id == run_id)
        candidate = await self.session.scalar(
            demand_stmt.order_by(desc(VkCollectionDemand.created_at)).limit(1)
        )
        if candidate is None:
            return None

        collection_ref = await self.session.get(
            VkSourceCollection, candidate.collection_id
        )
        if collection_ref is None:
            return None
        execution = await self.session.scalar(
            select(VkExecution)
            .where(VkExecution.id == collection_ref.execution_id)
            .with_for_update()
        )
        collection = await self.session.scalar(
            select(VkSourceCollection)
            .where(VkSourceCollection.id == candidate.collection_id)
            .with_for_update()
        )
        demand = await self.session.scalar(
            select(VkCollectionDemand)
            .where(VkCollectionDemand.id == candidate.id)
            .with_for_update()
        )
        if (
            execution is None
            or collection is None
            or demand is None
            or demand.status not in statuses
            or demand.task_id != task_id
            or (run_id is not None and demand.run_id != run_id)
        ):
            return None
        return execution, collection, demand

    async def _emit_late_join_started(
        self,
        execution: VkExecution,
        demand: VkCollectionDemand,
    ) -> None:
        if execution.current_attempt_id is None:
            raise RuntimeError(
                f"running execution {execution.id} has no current attempt"
            )
        attempt = await self.session.scalar(
            select(VkExecutionAttempt).where(
                VkExecutionAttempt.id == execution.current_attempt_id,
                VkExecutionAttempt.status == "running",
            )
        )
        if attempt is None:
            raise RuntimeError(
                f"running execution {execution.id} has no active attempt"
            )
        now = utcnow()
        payload = TaskExecutionStartedPayload(
            taskId=demand.task_id,
            runId=demand.run_id,
            ownerUserId=demand.owner_user_id,
            executor=EXECUTOR,
            workerId=attempt.worker_id,
            attempt=attempt.attempt_number,
            executionSequence=demand.execution_sequence,
            providerAccountKey=attempt.provider_account_key,
            credentialVersion=attempt.credential_version,
            startedAt=now.isoformat(),
        )
        self.session.add(
            OutboxEvent(
                id=uuid4(),
                event_type="task.execution_started",
                aggregate_type="task",
                aggregate_id=str(demand.task_id),
                dedupe_key=(
                    f"task.execution_started:{demand.id}:"
                    f"{attempt.attempt_number}"
                ),
                payload=payload.model_dump(mode="json", exclude_none=True),
                status="pending",
                attempts=0,
                next_attempt_at=now,
                created_at=now,
            )
        )
        await self.session.flush()

    async def _lock_task(self, task_id: int) -> None:
        await self._advisory_lock(f"task:{task_id}")

    async def _lock_identity(
        self, provider_account_key: str, source_key: str, fingerprint: str
    ) -> None:
        await self._advisory_lock(
            f"collection:{provider_account_key}:{source_key}:{fingerprint}"
        )

    async def _advisory_lock(self, lock_key: str) -> None:
        bind = self.session.get_bind()
        if bind.dialect.name != "postgresql":
            return
        await self.session.execute(
            text("SELECT pg_advisory_xact_lock(hashtext(:lock_key))"),
            {"lock_key": lock_key},
        )
