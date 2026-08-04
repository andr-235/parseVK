import json
from datetime import UTC, datetime
from numbers import Number
from uuid import UUID, uuid4

from common.events.task_execution_completed import TaskExecutionCompletedPayload
from common.events.task_execution_failed import TaskExecutionFailedPayload
from common.events.task_execution_progressed import TaskExecutionProgressedPayload
from common.events.task_execution_started import TaskExecutionStartedPayload
from sqlalchemy import and_, exists, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities import executions as execution_entities
from app.domain.entities.executions import VkExecutionClaim
from app.domain.entities.provider_account import (
    ACCOUNT_STATUS_ACTIVE,
    SYSTEM_VK_CAPABILITY,
)
from app.domain.repositories.executions import ExecutionRepository
from app.infrastructure.db.models.executions import VkExecution, VkExecutionAttempt
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.provider_accounts import VkProviderAccount
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)

EXECUTOR = "vk-service"
ACTIVE_DEMAND_STATUSES = ("pending", "running")
TERMINAL_BINDING_STATUSES = ("done", "failed", "cancelled")


def utcnow() -> datetime:
    return datetime.now(UTC)


def _as_utc(value: datetime | None) -> datetime | None:
    if value is None or value.tzinfo is not None:
        return value
    return value.replace(tzinfo=UTC)


def _group_ids(value) -> list[int]:
    if isinstance(value, str):
        serialized = value
    elif (
        isinstance(value, list)
        and value
        and value[0] == "["
        and value[-1] == "]"
    ):
        serialized = "".join(value)
    else:
        return [int(item) for item in (value or [])]
    return [int(item) for item in json.loads(serialized)]


def _execution_entity(model: VkExecution) -> execution_entities.VkExecution:
    return execution_entities.VkExecution(
        id=model.id,
        task_id=model.task_id,
        owner_user_id=model.owner_user_id,
        run_id=model.run_id,
        status=model.status,
        scope=model.scope,
        mode=model.mode,
        group_ids=_group_ids(model.group_ids),
        post_limit=model.post_limit,
        plan_snapshot=dict(model.plan_snapshot or {}),
        processed_items=model.processed_items,
        total_items=model.total_items,
        last_error=model.last_error,
        available_at=_as_utc(model.available_at),
        current_attempt_id=model.current_attempt_id,
        current_fencing_token=model.current_fencing_token,
        cancellation_requested_at=_as_utc(model.cancellation_requested_at),
        cancellation_reason=model.cancellation_reason,
        parent_execution_id=model.parent_execution_id,
        execution_sequence=model.execution_sequence,
        started_at=_as_utc(model.started_at),
        finished_at=_as_utc(model.finished_at),
        created_at=_as_utc(model.created_at),
        updated_at=_as_utc(model.updated_at),
    )


def _attempt_entity(model: VkExecutionAttempt) -> execution_entities.VkExecutionAttempt:
    return execution_entities.VkExecutionAttempt(
        id=model.id,
        execution_id=model.execution_id,
        attempt_number=model.attempt_number,
        fencing_token=model.fencing_token,
        worker_id=model.worker_id,
        status=model.status,
        provider_account_key=model.provider_account_key,
        credential_version=model.credential_version,
        lease_expires_at=_as_utc(model.lease_expires_at),
        heartbeat_at=_as_utc(model.heartbeat_at),
        started_at=_as_utc(model.started_at),
        finished_at=_as_utc(model.finished_at),
        last_error=model.last_error,
    )


def _merge_stats(values: list[dict]) -> dict:
    merged: dict = {}
    for stats in values:
        for key, value in (stats or {}).items():
            current = merged.get(key)
            if (
                isinstance(value, Number)
                and not isinstance(value, bool)
                and (current is None or isinstance(current, Number))
            ):
                merged[key] = (current or 0) + value
            elif key not in merged:
                merged[key] = value
    return merged


class SqlAlchemyExecutionRepository(ExecutionRepository):
    """Own physical source attempts and aggregate lifecycle by TaskRun binding."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def claim_next(
        self,
        *,
        worker_id: str,
        lease_expires_at: datetime,
        account_key: str = "system-vk",
    ) -> VkExecutionClaim | None:
        now = utcnow()
        account = await self.session.scalar(
            select(VkProviderAccount)
            .where(
                VkProviderAccount.account_key == account_key,
                VkProviderAccount.status == ACCOUNT_STATUS_ACTIVE,
                or_(
                    VkProviderAccount.cooldown_until.is_(None),
                    VkProviderAccount.cooldown_until <= now,
                ),
            )
            .with_for_update()
        )
        if account is None or SYSTEM_VK_CAPABILITY not in (account.capabilities or []):
            return None

        expired_current_attempt = exists().where(
            VkExecutionAttempt.id == VkExecution.current_attempt_id,
            VkExecutionAttempt.status == "running",
            VkExecutionAttempt.lease_expires_at <= now,
        )
        compatible_collection = exists().where(
            VkSourceCollection.execution_id == VkExecution.id,
            VkSourceCollection.provider_account_key == account_key,
            VkSourceCollection.status.in_(("pending", "running")),
        )
        active_demand = exists().where(
            VkSourceCollection.execution_id == VkExecution.id,
            VkCollectionDemand.collection_id == VkSourceCollection.id,
            VkCollectionDemand.status.in_(ACTIVE_DEMAND_STATUSES),
        )
        execution = await self.session.scalar(
            select(VkExecution)
            .where(
                VkExecution.cancellation_requested_at.is_(None),
                compatible_collection,
                active_demand,
                or_(
                    and_(
                        VkExecution.status == "pending",
                        VkExecution.available_at <= now,
                    ),
                    and_(VkExecution.status == "running", expired_current_attempt),
                ),
            )
            .order_by(VkExecution.available_at, VkExecution.created_at)
            .with_for_update(skip_locked=True)
            .limit(1)
        )
        if execution is None:
            return None

        if execution.current_attempt_id is not None:
            previous = await self.session.scalar(
                select(VkExecutionAttempt)
                .where(VkExecutionAttempt.id == execution.current_attempt_id)
                .with_for_update()
            )
            if previous is not None and previous.status == "running":
                previous.status = "expired"
                previous.finished_at = now
                previous.last_error = "lease expired"
                await self.session.flush()

        fencing_token = execution.current_fencing_token + 1
        attempt = VkExecutionAttempt(
            execution_id=execution.id,
            attempt_number=fencing_token,
            fencing_token=fencing_token,
            worker_id=worker_id,
            status="running",
            provider_account_key=account.account_key,
            credential_version=account.credential_version,
            lease_expires_at=lease_expires_at,
            heartbeat_at=now,
            started_at=now,
        )
        self.session.add(attempt)
        await self.session.flush()

        execution.status = "running"
        execution.current_attempt_id = attempt.id
        execution.current_fencing_token = fencing_token
        execution.execution_sequence += 1
        execution.started_at = execution.started_at or now
        execution.updated_at = now

        collection = await self._collection(execution.id, lock=True)
        if collection is None:
            raise RuntimeError(f"execution {execution.id} has no source collection")
        demands = await self._active_demands(execution.id, lock=True)
        if not demands:
            raise RuntimeError(f"execution {execution.id} has no active source demands")

        collection.status = "running"
        collection.started_at = collection.started_at or now
        collection.updated_at = now
        for demand in demands:
            demand.status = "running"
            demand.execution_sequence += 1
            demand.updated_at = now
        await self._mark_bindings_started(demands, attempt, now)

        await self.session.flush()
        return VkExecutionClaim(
            execution=_execution_entity(execution),
            attempt=_attempt_entity(attempt),
        )

    async def _load_current(
        self,
        *,
        execution_id: UUID,
        attempt_id: UUID,
        fencing_token: int,
        allow_cancel_requested: bool = False,
    ) -> tuple[VkExecution, VkExecutionAttempt] | None:
        execution = await self.session.scalar(
            select(VkExecution)
            .where(VkExecution.id == execution_id)
            .with_for_update()
        )
        if (
            execution is None
            or execution.status != "running"
            or execution.current_attempt_id != attempt_id
            or execution.current_fencing_token != fencing_token
            or (
                not allow_cancel_requested
                and execution.cancellation_requested_at is not None
            )
        ):
            return None
        attempt = await self.session.scalar(
            select(VkExecutionAttempt)
            .where(VkExecutionAttempt.id == attempt_id)
            .with_for_update()
        )
        if (
            attempt is None
            or attempt.execution_id != execution_id
            or attempt.fencing_token != fencing_token
            or attempt.status != "running"
        ):
            return None
        return execution, attempt

    async def renew(
        self,
        *,
        execution_id: UUID,
        attempt_id: UUID,
        fencing_token: int,
        lease_expires_at: datetime,
    ) -> bool:
        owned = await self._load_current(
            execution_id=execution_id,
            attempt_id=attempt_id,
            fencing_token=fencing_token,
        )
        if owned is None:
            return False
        execution, attempt = owned
        now = utcnow()
        attempt.heartbeat_at = now
        attempt.lease_expires_at = lease_expires_at
        execution.updated_at = now
        collection = await self._collection(execution.id)
        if collection is not None:
            collection.updated_at = now
        await self.session.flush()
        return True

    async def report_progress(
        self,
        *,
        execution_id: UUID,
        processed_items: int,
        total_items: int,
        stats: dict | None,
        occurred_at: str,
    ) -> int:
        demands = await self._active_demands(execution_id, lock=True)
        if not demands:
            return 0
        now = utcnow()
        for demand in demands:
            demand.processed_items = processed_items
            demand.total_items = total_items
            demand.stats = dict(stats or {})
            demand.updated_at = now

        emitted = 0
        for binding_id in sorted({d.binding_id for d in demands}, key=str):
            binding = await self._binding(binding_id, lock=True)
            if binding is None or binding.status in TERMINAL_BINDING_STATUSES:
                continue
            all_demands = await self._binding_demands(binding_id)
            self._apply_binding_totals(binding, all_demands, now)
            binding.execution_sequence += 1
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
            self._add_outbox(
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
        await self.session.flush()
        return emitted

    async def complete(
        self,
        *,
        execution_id: UUID,
        attempt_id: UUID,
        fencing_token: int,
        processed_items: int,
        total_items: int,
        stats: dict | None = None,
    ) -> bool:
        owned = await self._load_current(
            execution_id=execution_id,
            attempt_id=attempt_id,
            fencing_token=fencing_token,
        )
        if owned is None:
            return False
        execution, attempt = owned
        now = utcnow()
        demands = await self._active_demands(execution.id, lock=True)
        if not demands:
            return False

        attempt.status = "done"
        attempt.finished_at = now
        execution.status = "done"
        execution.finished_at = now
        execution.processed_items = processed_items
        execution.total_items = total_items
        execution.last_error = None
        execution.execution_sequence += 1
        execution.updated_at = now

        collection = await self._collection(execution.id, lock=True)
        if collection is None:
            raise RuntimeError(f"execution {execution.id} has no source collection")
        collection.status = "done"
        collection.finished_at = now
        collection.last_error = None
        collection.updated_at = now

        binding_ids: set[UUID] = set()
        for demand in demands:
            demand.status = "done"
            demand.finished_at = now
            demand.last_error = None
            demand.processed_items = processed_items
            demand.total_items = total_items
            demand.stats = dict(stats or {})
            demand.execution_sequence += 1
            demand.updated_at = now
            binding_ids.add(demand.binding_id)
        await self._finalize_bindings(binding_ids, attempt.worker_id, now)
        await self.session.flush()
        return True

    async def fail(
        self,
        *,
        execution_id: UUID,
        attempt_id: UUID,
        fencing_token: int,
        error: str,
        processed_items: int = 0,
        total_items: int = 0,
        stats: dict | None = None,
    ) -> bool:
        owned = await self._load_current(
            execution_id=execution_id,
            attempt_id=attempt_id,
            fencing_token=fencing_token,
        )
        if owned is None:
            return False
        execution, attempt = owned
        now = utcnow()
        demands = await self._active_demands(execution.id, lock=True)
        if not demands:
            return False
        safe_error = error[:2000]

        attempt.status = "failed"
        attempt.finished_at = now
        attempt.last_error = safe_error
        execution.status = "failed"
        execution.finished_at = now
        execution.last_error = safe_error
        execution.processed_items = processed_items
        execution.total_items = total_items
        execution.execution_sequence += 1
        execution.updated_at = now

        collection = await self._collection(execution.id, lock=True)
        if collection is None:
            raise RuntimeError(f"execution {execution.id} has no source collection")
        collection.status = "failed"
        collection.finished_at = now
        collection.last_error = safe_error
        collection.updated_at = now

        binding_ids: set[UUID] = set()
        for demand in demands:
            demand.status = "failed"
            demand.finished_at = now
            demand.last_error = safe_error
            demand.processed_items = processed_items
            demand.total_items = total_items
            demand.stats = dict(stats or {})
            demand.execution_sequence += 1
            demand.updated_at = now
            binding_ids.add(demand.binding_id)
        await self._finalize_bindings(binding_ids, attempt.worker_id, now)
        await self.session.flush()
        return True

    async def cancel(
        self,
        *,
        execution_id: UUID,
        attempt_id: UUID,
        fencing_token: int,
    ) -> bool:
        owned = await self._load_current(
            execution_id=execution_id,
            attempt_id=attempt_id,
            fencing_token=fencing_token,
            allow_cancel_requested=True,
        )
        if owned is None:
            return False
        execution, attempt = owned
        now = utcnow()
        attempt.status = "cancelled"
        attempt.finished_at = now
        execution.status = "cancelled"
        execution.finished_at = now
        execution.last_error = execution.cancellation_reason
        execution.updated_at = now

        collection = await self._collection(execution.id, lock=True)
        if collection is not None:
            collection.status = "cancelled"
            collection.finished_at = now
            collection.last_error = execution.cancellation_reason
            collection.updated_at = now
        await self.session.flush()
        return True

    async def release(
        self,
        *,
        execution_id: UUID,
        attempt_id: UUID,
        fencing_token: int,
        error: str,
        available_at: datetime,
    ) -> bool:
        owned = await self._load_current(
            execution_id=execution_id,
            attempt_id=attempt_id,
            fencing_token=fencing_token,
            allow_cancel_requested=True,
        )
        if owned is None:
            return False
        execution, attempt = owned
        now = utcnow()
        attempt.status = "abandoned"
        attempt.finished_at = now
        attempt.last_error = error[:2000]
        collection = await self._collection(execution.id, lock=True)
        demands = await self._active_demands(execution.id, lock=True)

        if execution.cancellation_requested_at is not None:
            execution.status = "cancelled"
            execution.finished_at = now
            if collection is not None:
                collection.status = "cancelled"
                collection.finished_at = now
                collection.last_error = execution.cancellation_reason or error[:2000]
        else:
            execution.status = "pending"
            execution.available_at = available_at
            if collection is not None:
                collection.status = "pending"
                collection.last_error = error[:2000]
            for demand in demands:
                demand.status = "pending"
                demand.last_error = error[:2000]
                demand.updated_at = now

        execution.current_attempt_id = None
        execution.last_error = error[:2000]
        execution.updated_at = now
        if collection is not None:
            collection.updated_at = now
        await self.session.flush()
        return True

    async def _mark_bindings_started(
        self,
        demands: list[VkCollectionDemand],
        attempt: VkExecutionAttempt,
        now: datetime,
    ) -> None:
        for binding_id in sorted({d.binding_id for d in demands}, key=str):
            binding = await self._binding(binding_id, lock=True)
            if binding is None or binding.status != "pending":
                continue
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
            self._add_outbox(
                event_type="task.execution_started",
                task_id=binding.task_id,
                dedupe_key=f"task.execution_started:{binding.id}",
                payload=payload.model_dump(mode="json", exclude_none=True),
                now=now,
            )

    async def _finalize_bindings(
        self,
        binding_ids: set[UUID],
        worker_id: str,
        now: datetime,
    ) -> None:
        for binding_id in sorted(binding_ids, key=str):
            binding = await self._binding(binding_id, lock=True)
            if binding is None:
                continue
            demands = await self._binding_demands(binding_id, lock=True)
            self._apply_binding_totals(binding, demands, now)
            if any(d.status in ACTIVE_DEMAND_STATUSES for d in demands):
                continue
            if binding.status in TERMINAL_BINDING_STATUSES:
                continue

            binding.execution_sequence += 1
            binding.finished_at = now
            if binding.failed_demands:
                binding.status = "failed"
                binding.last_error = next(
                    (
                        demand.last_error
                        for demand in demands
                        if demand.status == "failed" and demand.last_error
                    ),
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
                self._add_outbox(
                    event_type="task.execution_failed",
                    task_id=binding.task_id,
                    dedupe_key=f"task.execution_failed:{binding.id}",
                    payload=payload.model_dump(mode="json"),
                    now=now,
                )
            elif binding.cancelled_demands:
                binding.status = "cancelled"
                binding.last_error = binding.cancellation_reason
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
                self._add_outbox(
                    event_type="task.execution_completed",
                    task_id=binding.task_id,
                    dedupe_key=f"task.execution_completed:{binding.id}",
                    payload=payload.model_dump(mode="json"),
                    now=now,
                )

    def _apply_binding_totals(
        self,
        binding: VkTaskRunBinding,
        demands: list[VkCollectionDemand],
        now: datetime,
    ) -> None:
        binding.completed_demands = sum(d.status == "done" for d in demands)
        binding.failed_demands = sum(d.status == "failed" for d in demands)
        binding.cancelled_demands = sum(d.status == "cancelled" for d in demands)
        binding.processed_items = sum(d.processed_items for d in demands)
        binding.total_items = sum(d.total_items for d in demands)
        binding.stats = _merge_stats([dict(d.stats or {}) for d in demands])
        binding.updated_at = now

    async def _collection(
        self,
        execution_id: UUID,
        *,
        lock: bool = False,
    ) -> VkSourceCollection | None:
        stmt = select(VkSourceCollection).where(
            VkSourceCollection.execution_id == execution_id
        )
        if lock:
            stmt = stmt.with_for_update()
        return await self.session.scalar(stmt)

    async def _active_demands(
        self,
        execution_id: UUID,
        *,
        lock: bool = False,
    ) -> list[VkCollectionDemand]:
        stmt = (
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
        if lock:
            stmt = stmt.with_for_update()
        return list((await self.session.scalars(stmt)).all())

    async def _binding(
        self,
        binding_id: UUID,
        *,
        lock: bool = False,
    ) -> VkTaskRunBinding | None:
        stmt = select(VkTaskRunBinding).where(VkTaskRunBinding.id == binding_id)
        if lock:
            stmt = stmt.with_for_update()
        return await self.session.scalar(stmt)

    async def _binding_demands(
        self,
        binding_id: UUID,
        *,
        lock: bool = False,
    ) -> list[VkCollectionDemand]:
        stmt = (
            select(VkCollectionDemand)
            .where(VkCollectionDemand.binding_id == binding_id)
            .order_by(VkCollectionDemand.created_at, VkCollectionDemand.id)
        )
        if lock:
            stmt = stmt.with_for_update()
        return list((await self.session.scalars(stmt)).all())

    def _add_outbox(
        self,
        *,
        event_type: str,
        task_id: int,
        dedupe_key: str,
        payload: dict,
        now: datetime,
    ) -> None:
        self.session.add(
            OutboxEvent(
                id=uuid4(),
                event_type=event_type,
                aggregate_type="task",
                aggregate_id=str(task_id),
                dedupe_key=dedupe_key,
                payload=payload,
                status="pending",
                attempts=0,
                next_attempt_at=now,
                created_at=now,
            )
        )
