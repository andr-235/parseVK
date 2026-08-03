from datetime import UTC, datetime
from uuid import UUID, uuid4

from common.events.task_execution_completed import TaskExecutionCompletedPayload
from common.events.task_execution_failed import TaskExecutionFailedPayload
from common.events.task_execution_started import TaskExecutionStartedPayload
from sqlalchemy import and_, exists, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.executions import (
    VkExecution as VkExecutionEntity,
    VkExecutionAttempt as VkExecutionAttemptEntity,
    VkExecutionClaim,
)
from app.domain.entities.provider_account import (
    ACCOUNT_STATUS_ACTIVE,
    SYSTEM_VK_CAPABILITY,
)
from app.domain.repositories.executions import ExecutionRepository
from app.infrastructure.db.models.executions import VkExecution, VkExecutionAttempt
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.provider_accounts import VkProviderAccount

EXECUTOR = "vk-service"


def utcnow() -> datetime:
    return datetime.now(UTC)


def _execution_entity(model: VkExecution) -> VkExecutionEntity:
    return VkExecutionEntity(
        id=model.id,
        task_id=model.task_id,
        owner_user_id=model.owner_user_id,
        run_id=model.run_id,
        status=model.status,
        scope=model.scope,
        mode=model.mode,
        group_ids=list(model.group_ids or []),
        post_limit=model.post_limit,
        plan_snapshot=dict(model.plan_snapshot or {}),
        processed_items=model.processed_items,
        total_items=model.total_items,
        last_error=model.last_error,
        available_at=model.available_at,
        current_attempt_id=model.current_attempt_id,
        current_fencing_token=model.current_fencing_token,
        cancellation_requested_at=model.cancellation_requested_at,
        cancellation_reason=model.cancellation_reason,
        parent_execution_id=model.parent_execution_id,
        execution_sequence=model.execution_sequence,
        started_at=model.started_at,
        finished_at=model.finished_at,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def _attempt_entity(model: VkExecutionAttempt) -> VkExecutionAttemptEntity:
    return VkExecutionAttemptEntity(
        id=model.id,
        execution_id=model.execution_id,
        attempt_number=model.attempt_number,
        fencing_token=model.fencing_token,
        worker_id=model.worker_id,
        status=model.status,
        provider_account_key=model.provider_account_key,
        credential_version=model.credential_version,
        lease_expires_at=model.lease_expires_at,
        heartbeat_at=model.heartbeat_at,
        started_at=model.started_at,
        finished_at=model.finished_at,
        last_error=model.last_error,
    )


class SqlAlchemyExecutionRepository(ExecutionRepository):
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
        execution = await self.session.scalar(
            select(VkExecution)
            .where(
                VkExecution.cancellation_requested_at.is_(None),
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

        payload = TaskExecutionStartedPayload(
            taskId=execution.task_id,
            runId=execution.run_id,
            ownerUserId=execution.owner_user_id,
            executor=EXECUTOR,
            workerId=worker_id,
            attempt=attempt.attempt_number,
            executionSequence=execution.execution_sequence,
            providerAccountKey=attempt.provider_account_key,
            credentialVersion=attempt.credential_version,
            startedAt=now.isoformat(),
        )
        self.session.add(
            OutboxEvent(
                id=uuid4(),
                event_type="task.execution_started",
                aggregate_type="task",
                aggregate_id=str(execution.task_id),
                dedupe_key=f"task.execution_started:{execution.id}:{attempt.attempt_number}",
                payload=payload.model_dump(mode="json", exclude_none=True),
                status="pending",
                attempts=0,
                next_attempt_at=now,
                created_at=now,
            )
        )
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
        await self.session.flush()
        return True

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
        attempt.status = "done"
        attempt.finished_at = now
        execution.status = "done"
        execution.finished_at = now
        execution.processed_items = processed_items
        execution.total_items = total_items
        execution.last_error = None
        execution.execution_sequence += 1
        execution.updated_at = now
        payload = TaskExecutionCompletedPayload(
            taskId=execution.task_id,
            runId=execution.run_id,
            ownerUserId=execution.owner_user_id,
            executor=EXECUTOR,
            workerId=attempt.worker_id,
            executionSequence=execution.execution_sequence,
            processedItems=processed_items,
            totalItems=total_items,
            stats=stats or {},
            completedAt=now.isoformat(),
        )
        self.session.add(
            OutboxEvent(
                id=uuid4(),
                event_type="task.execution_completed",
                aggregate_type="task",
                aggregate_id=str(execution.task_id),
                dedupe_key=f"task.execution_completed:{execution.id}",
                payload=payload.model_dump(mode="json"),
                status="pending",
                attempts=0,
                next_attempt_at=now,
                created_at=now,
            )
        )
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
        payload = TaskExecutionFailedPayload(
            taskId=execution.task_id,
            runId=execution.run_id,
            ownerUserId=execution.owner_user_id,
            executor=EXECUTOR,
            workerId=attempt.worker_id,
            executionSequence=execution.execution_sequence,
            processedItems=processed_items,
            totalItems=total_items,
            stats=stats or {},
            error=safe_error,
            failureKind="terminal",
            failedAt=now.isoformat(),
        )
        self.session.add(
            OutboxEvent(
                id=uuid4(),
                event_type="task.execution_failed",
                aggregate_type="task",
                aggregate_id=str(execution.task_id),
                dedupe_key=f"task.execution_failed:{execution.id}",
                payload=payload.model_dump(mode="json"),
                status="pending",
                attempts=0,
                next_attempt_at=now,
                created_at=now,
            )
        )
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
        if execution.cancellation_requested_at is not None:
            execution.status = "cancelled"
            execution.finished_at = now
        else:
            execution.status = "pending"
            execution.available_at = available_at
        execution.current_attempt_id = None
        execution.last_error = error[:2000]
        execution.updated_at = now
        await self.session.flush()
        return True
