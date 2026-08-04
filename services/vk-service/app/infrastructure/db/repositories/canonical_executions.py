from datetime import UTC, datetime
from numbers import Number
from uuid import UUID, uuid4

from common.events.task_execution_completed import TaskExecutionCompletedPayload
from common.events.task_execution_failed import TaskExecutionFailedPayload
from common.events.task_execution_progressed import TaskExecutionProgressedPayload
from common.events.task_execution_started import TaskExecutionStartedPayload
from sqlalchemy import delete, select

from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)
from app.infrastructure.db.repositories.executions import SqlAlchemyExecutionRepository

ACTIVE_DEMAND_STATUSES = ("pending", "running")
TERMINAL_DEMAND_STATUSES = ("done", "failed", "cancelled")
TERMINAL_BINDING_STATUSES = ("done", "failed", "cancelled")
EXECUTOR = "vk-service"


def utcnow() -> datetime:
    return datetime.now(UTC)


def _add_outbox(
    session,
    *,
    event_type: str,
    task_id: int,
    dedupe_key: str,
    payload: dict,
    now: datetime,
) -> None:
    session.add(
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


def _merge_stats(stats_values: list[dict]) -> dict:
    merged: dict = {}
    for stats in stats_values:
        for key, value in (stats or {}).items():
            if isinstance(value, Number) and isinstance(merged.get(key, 0), Number):
                merged[key] = merged.get(key, 0) + value
            elif key not in merged:
                merged[key] = value
    return merged


async def _demands_for_execution(
    session,
    execution_id: UUID,
    *,
    active_only: bool,
    lock: bool = False,
) -> list[VkCollectionDemand]:
    stmt = (
        select(VkCollectionDemand)
        .join(
            VkSourceCollection,
            VkSourceCollection.id == VkCollectionDemand.collection_id,
        )
        .where(VkSourceCollection.execution_id == execution_id)
        .order_by(VkCollectionDemand.created_at, VkCollectionDemand.id)
    )
    if active_only:
        stmt = stmt.where(VkCollectionDemand.status.in_(ACTIVE_DEMAND_STATUSES))
    if lock:
        stmt = stmt.with_for_update()
    return list((await session.scalars(stmt)).all())


async def _mark_bindings_started(session, demands, attempt, now: datetime) -> None:
    binding_ids = sorted({demand.binding_id for demand in demands}, key=str)
    for binding_id in binding_ids:
        binding = await session.scalar(
            select(VkTaskRunBinding)
            .where(VkTaskRunBinding.id == binding_id)
            .with_for_update()
        )
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
        _add_outbox(
            session,
            event_type="task.execution_started",
            task_id=binding.task_id,
            dedupe_key=f"task.execution_started:{binding.id}",
            payload=payload.model_dump(mode="json", exclude_none=True),
            now=now,
        )


async def _finalize_bindings(
    session,
    binding_ids: set[UUID],
    *,
    worker_id: str,
    now: datetime,
) -> None:
    for binding_id in sorted(binding_ids, key=str):
        binding = await session.scalar(
            select(VkTaskRunBinding)
            .where(VkTaskRunBinding.id == binding_id)
            .with_for_update()
        )
        if binding is None:
            continue
        demands = list(
            (
                await session.scalars(
                    select(VkCollectionDemand)
                    .where(VkCollectionDemand.binding_id == binding_id)
                    .order_by(VkCollectionDemand.created_at, VkCollectionDemand.id)
                    .with_for_update()
                )
            ).all()
        )
        binding.completed_demands = sum(d.status == "done" for d in demands)
        binding.failed_demands = sum(d.status == "failed" for d in demands)
        binding.cancelled_demands = sum(d.status == "cancelled" for d in demands)
        binding.processed_items = sum(d.processed_items for d in demands)
        binding.total_items = sum(d.total_items for d in demands)
        binding.stats = _merge_stats([dict(d.stats or {}) for d in demands])
        binding.updated_at = now

        active = [d for d in demands if d.status in ACTIVE_DEMAND_STATUSES]
        if active:
            if binding.status == "pending":
                binding.status = "running"
            continue
        if binding.status in TERMINAL_BINDING_STATUSES:
            continue

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
            _add_outbox(
                session,
                event_type="task.execution_failed",
                task_id=binding.task_id,
                dedupe_key=f"task.execution_failed:{binding.id}",
                payload=payload.model_dump(mode="json"),
                now=now,
            )
        elif binding.cancellation_requested_at is not None or binding.cancelled_demands:
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
            _add_outbox(
                session,
                event_type="task.execution_completed",
                task_id=binding.task_id,
                dedupe_key=f"task.execution_completed:{binding.id}",
                payload=payload.model_dump(mode="json"),
                now=now,
            )


async def report_binding_progress(
    session,
    *,
    execution_id: UUID,
    processed_items: int,
    total_items: int,
    stats: dict | None,
    occurred_at: str,
) -> int:
    demands = await _demands_for_execution(
        session,
        execution_id,
        active_only=True,
        lock=True,
    )
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
        binding = await session.scalar(
            select(VkTaskRunBinding)
            .where(VkTaskRunBinding.id == binding_id)
            .with_for_update()
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
        binding.processed_items = sum(d.processed_items for d in all_demands)
        binding.total_items = sum(d.total_items for d in all_demands)
        binding.stats = _merge_stats([dict(d.stats or {}) for d in all_demands])
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
        _add_outbox(
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


class CanonicalExecutionRepository(SqlAlchemyExecutionRepository):
    async def claim_next(self, **kwargs):
        claim = await super().claim_next(**kwargs)
        if claim is None:
            return None
        demands = await _demands_for_execution(
            self.session,
            claim.execution_id,
            active_only=True,
            lock=True,
        )
        if not demands:
            raise RuntimeError(
                f"canonical execution {claim.execution_id} has no active demands"
            )
        keys = [
            f"task.execution_started:{demand.id}:{claim.attempt_number}"
            for demand in demands
        ]
        await self.session.execute(
            delete(OutboxEvent).where(
                OutboxEvent.event_type == "task.execution_started",
                OutboxEvent.dedupe_key.in_(keys),
            )
        )
        await _mark_bindings_started(
            self.session,
            demands,
            claim.attempt,
            utcnow(),
        )
        await self.session.flush()
        return claim

    async def complete(self, **kwargs) -> bool:
        execution_id = kwargs["execution_id"]
        demands = await _demands_for_execution(
            self.session,
            execution_id,
            active_only=True,
            lock=True,
        )
        completed = await super().complete(**kwargs)
        if not completed:
            return False
        stats = dict(kwargs.get("stats") or {})
        processed_items = int(kwargs.get("processed_items") or 0)
        total_items = int(kwargs.get("total_items") or 0)
        keys = [f"task.execution_completed:{demand.id}" for demand in demands]
        await self.session.execute(
            delete(OutboxEvent).where(
                OutboxEvent.event_type == "task.execution_completed",
                OutboxEvent.dedupe_key.in_(keys),
            )
        )
        for demand in demands:
            demand.processed_items = processed_items
            demand.total_items = total_items
            demand.stats = stats
        attempt = await self.session.get(
            __import__(
                "app.infrastructure.db.models.executions",
                fromlist=["VkExecutionAttempt"],
            ).VkExecutionAttempt,
            kwargs["attempt_id"],
        )
        await _finalize_bindings(
            self.session,
            {d.binding_id for d in demands},
            worker_id=attempt.worker_id if attempt is not None else EXECUTOR,
            now=utcnow(),
        )
        await self.session.flush()
        return True

    async def fail(self, **kwargs) -> bool:
        execution_id = kwargs["execution_id"]
        demands = await _demands_for_execution(
            self.session,
            execution_id,
            active_only=True,
            lock=True,
        )
        failed = await super().fail(**kwargs)
        if not failed:
            return False
        stats = dict(kwargs.get("stats") or {})
        processed_items = int(kwargs.get("processed_items") or 0)
        total_items = int(kwargs.get("total_items") or 0)
        keys = [f"task.execution_failed:{demand.id}" for demand in demands]
        await self.session.execute(
            delete(OutboxEvent).where(
                OutboxEvent.event_type == "task.execution_failed",
                OutboxEvent.dedupe_key.in_(keys),
            )
        )
        for demand in demands:
            demand.processed_items = processed_items
            demand.total_items = total_items
            demand.stats = stats
        attempt = await self.session.get(
            __import__(
                "app.infrastructure.db.models.executions",
                fromlist=["VkExecutionAttempt"],
            ).VkExecutionAttempt,
            kwargs["attempt_id"],
        )
        await _finalize_bindings(
            self.session,
            {d.binding_id for d in demands},
            worker_id=attempt.worker_id if attempt is not None else EXECUTOR,
            now=utcnow(),
        )
        await self.session.flush()
        return True

    async def cancel(self, **kwargs) -> bool:
        demands = await _demands_for_execution(
            self.session,
            kwargs["execution_id"],
            active_only=True,
            lock=True,
        )
        cancelled = await super().cancel(**kwargs)
        if cancelled:
            await _finalize_bindings(
                self.session,
                {d.binding_id for d in demands},
                worker_id=EXECUTOR,
                now=utcnow(),
            )
        return cancelled

    async def release(self, **kwargs) -> bool:
        demands = await _demands_for_execution(
            self.session,
            kwargs["execution_id"],
            active_only=True,
            lock=True,
        )
        released = await super().release(**kwargs)
        if released:
            await _finalize_bindings(
                self.session,
                {d.binding_id for d in demands},
                worker_id=EXECUTOR,
                now=utcnow(),
            )
        return released
