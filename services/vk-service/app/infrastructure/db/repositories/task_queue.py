import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import and_, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.provider_account import (
    ACCOUNT_STATUS_ACTIVE,
    SYSTEM_VK_CAPABILITY,
)
from app.domain.entities.tasks import VkTaskRun as VkTaskRunEntity
from app.domain.repositories.task_queue import TaskQueueRepository
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.provider_accounts import VkProviderAccount
from app.infrastructure.db.models.tasks import VkTaskRun
from app.infrastructure.db.repositories.tasks import _to_task_run_entity
from common.events.task_execution_completed import TaskExecutionCompletedPayload
from common.events.task_execution_failed import TaskExecutionFailedPayload
from common.events.task_execution_started import TaskExecutionStartedPayload

logger = logging.getLogger("vk-service")

EXECUTOR = "vk-service"


def utcnow() -> datetime:
    return datetime.now(UTC)


class SqlAlchemyTaskQueueRepository(TaskQueueRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def claim_next(
        self,
        *,
        worker_id: str,
        lease_expires_at: datetime,
        account_key: str = "system-vk",
    ) -> VkTaskRunEntity | None:
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

        model = await self.session.scalar(
            select(VkTaskRun)
            .where(
                or_(
                    and_(VkTaskRun.status == "pending", VkTaskRun.available_at <= now),
                    and_(
                        VkTaskRun.status == "running",
                        or_(
                            VkTaskRun.lease_expires_at.is_(None),
                            VkTaskRun.lease_expires_at <= now,
                        ),
                    ),
                )
            )
            .order_by(VkTaskRun.available_at, VkTaskRun.created_at)
            .with_for_update(skip_locked=True)
            .limit(1)
        )
        if model is None:
            return None
        if model.lease_expires_at is None:
            logger.info(
                "[TaskQueueRepository.claim_next] Claimed task_id=%s with NULL lease (recovery)",
                model.task_id,
            )
        else:
            logger.debug(
                "[TaskQueueRepository.claim_next] Claimed task_id=%s with lease expires at %s",
                model.task_id,
                model.lease_expires_at,
            )

        model.status = "running"
        model.attempts += 1
        model.execution_sequence += 1
        model.provider_account_key = account.account_key
        model.credential_version = account.credential_version
        model.lease_owner = worker_id
        model.lease_expires_at = lease_expires_at
        model.heartbeat_at = now
        model.started_at = model.started_at or now
        model.updated_at = now
        await self.session.flush()

        payload = TaskExecutionStartedPayload(
            taskId=model.task_id,
            runId=model.run_id,
            ownerUserId=model.owner_user_id,
            executor=EXECUTOR,
            workerId=worker_id,
            attempt=model.attempts,
            executionSequence=model.execution_sequence,
            providerAccountKey=model.provider_account_key,
            credentialVersion=model.credential_version,
            startedAt=now.isoformat(),
        )
        self.session.add(
            OutboxEvent(
                id=uuid.uuid4(),
                event_type="task.execution_started",
                aggregate_type="task",
                aggregate_id=str(model.task_id),
                dedupe_key=(
                    f"task.execution_started:{model.task_id}:"
                    f"{model.run_id}:{model.execution_sequence}"
                ),
                payload=payload.model_dump(mode="json", exclude_none=True),
                status="pending",
                attempts=0,
                next_attempt_at=now,
                created_at=now,
            )
        )
        await self.session.flush()

        return _to_task_run_entity(model)

    async def renew_lease(
        self, *, task_id: int, run_id: str, worker_id: str, lease_expires_at: datetime
    ) -> bool:
        return await self._update_owned(
            task_id,
            run_id,
            worker_id,
            lease_expires_at=lease_expires_at,
            heartbeat_at=utcnow(),
            updated_at=utcnow(),
        )

    async def mark_done(
        self,
        *,
        task_id: int,
        run_id: str,
        worker_id: str,
        processed_items: int,
        total_items: int,
        stats: dict | None = None,
    ) -> bool:
        now = utcnow()
        result = await self.session.execute(
            update(VkTaskRun)
            .where(
                VkTaskRun.task_id == task_id,
                VkTaskRun.run_id == run_id,
                VkTaskRun.status == "running",
                VkTaskRun.lease_owner == worker_id,
            )
            .values(
                status="done",
                finished_at=now,
                processed_items=processed_items,
                total_items=total_items,
                execution_sequence=VkTaskRun.execution_sequence + 1,
                lease_owner=None,
                lease_expires_at=None,
                updated_at=now,
            )
            .returning(
                VkTaskRun.task_id,
                VkTaskRun.owner_user_id,
                VkTaskRun.execution_sequence,
            )
        )
        row = result.one_or_none()
        if row is None:
            return False

        _, owner_user_id, execution_sequence = row
        payload = TaskExecutionCompletedPayload(
            taskId=task_id,
            runId=run_id,
            ownerUserId=owner_user_id,
            executor=EXECUTOR,
            workerId=worker_id,
            executionSequence=execution_sequence,
            processedItems=processed_items,
            totalItems=total_items,
            stats=stats or {},
            completedAt=now.isoformat(),
        )
        self.session.add(
            OutboxEvent(
                id=uuid.uuid4(),
                event_type="task.execution_completed",
                aggregate_type="task",
                aggregate_id=str(task_id),
                dedupe_key=(
                    f"task.execution_completed:{task_id}:{run_id}:{execution_sequence}"
                ),
                payload=payload.model_dump(mode="json"),
                status="pending",
                attempts=0,
                next_attempt_at=now,
                created_at=now,
            )
        )
        await self.session.flush()
        return True

    async def mark_failed(
        self,
        *,
        task_id: int,
        run_id: str,
        worker_id: str,
        error: str,
        processed_items: int = 0,
        total_items: int = 0,
        stats: dict | None = None,
    ) -> bool:
        now = utcnow()
        result = await self.session.execute(
            update(VkTaskRun)
            .where(
                VkTaskRun.task_id == task_id,
                VkTaskRun.run_id == run_id,
                VkTaskRun.status == "running",
                VkTaskRun.lease_owner == worker_id,
            )
            .values(
                status="failed",
                finished_at=now,
                last_error=error,
                execution_sequence=VkTaskRun.execution_sequence + 1,
                lease_owner=None,
                lease_expires_at=None,
                updated_at=now,
            )
            .returning(
                VkTaskRun.task_id,
                VkTaskRun.owner_user_id,
                VkTaskRun.execution_sequence,
            )
        )
        row = result.one_or_none()
        if row is None:
            return False

        _, owner_user_id, execution_sequence = row
        payload = TaskExecutionFailedPayload(
            taskId=task_id,
            runId=run_id,
            ownerUserId=owner_user_id,
            executor=EXECUTOR,
            workerId=worker_id,
            executionSequence=execution_sequence,
            processedItems=processed_items,
            totalItems=total_items,
            stats=stats or {},
            error=error,
            failureKind="terminal",
            failedAt=now.isoformat(),
        )
        self.session.add(
            OutboxEvent(
                id=uuid.uuid4(),
                event_type="task.execution_failed",
                aggregate_type="task",
                aggregate_id=str(task_id),
                dedupe_key=(
                    f"task.execution_failed:{task_id}:{run_id}:{execution_sequence}"
                ),
                payload=payload.model_dump(mode="json"),
                status="pending",
                attempts=0,
                next_attempt_at=now,
                created_at=now,
            )
        )
        await self.session.flush()
        return True

    async def release(
        self,
        *,
        task_id: int,
        run_id: str,
        worker_id: str,
        error: str,
        available_at: datetime,
    ) -> bool:
        return await self._update_owned(
            task_id,
            run_id,
            worker_id,
            status="pending",
            last_error=error,
            available_at=available_at,
            lease_owner=None,
            lease_expires_at=None,
            updated_at=utcnow(),
        )

    async def _update_owned(
        self, task_id: int, run_id: str, worker_id: str, **values
    ) -> bool:
        result = await self.session.execute(
            update(VkTaskRun)
            .where(
                VkTaskRun.task_id == task_id,
                VkTaskRun.run_id == run_id,
                VkTaskRun.status == "running",
                VkTaskRun.lease_owner == worker_id,
            )
            .values(**values)
            .returning(VkTaskRun.id)
        )
        return result.scalar_one_or_none() is not None
