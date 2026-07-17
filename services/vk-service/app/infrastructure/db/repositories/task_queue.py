from datetime import UTC, datetime

from sqlalchemy import and_, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.tasks import VkTaskRun as VkTaskRunEntity
from app.domain.repositories.task_queue import TaskQueueRepository
from app.infrastructure.db.models.tasks import VkTaskRun
from app.infrastructure.db.repositories.tasks import _to_task_run_entity


def utcnow() -> datetime:
    return datetime.now(UTC)


class SqlAlchemyTaskQueueRepository(TaskQueueRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def claim_next(
        self, *, worker_id: str, lease_expires_at: datetime
    ) -> VkTaskRunEntity | None:
        now = utcnow()
        model = await self.session.scalar(
            select(VkTaskRun)
            .where(
                or_(
                    and_(VkTaskRun.status == "pending", VkTaskRun.available_at <= now),
                    and_(VkTaskRun.status == "running", VkTaskRun.lease_expires_at <= now),
                )
            )
            .order_by(VkTaskRun.available_at, VkTaskRun.created_at)
            .with_for_update(skip_locked=True)
            .limit(1)
        )
        if model is None:
            return None
        model.status = "running"
        model.attempts += 1
        model.lease_owner = worker_id
        model.lease_expires_at = lease_expires_at
        model.heartbeat_at = now
        model.started_at = model.started_at or now
        model.updated_at = now
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
    ) -> bool:
        return await self._update_owned(
            task_id,
            run_id,
            worker_id,
            status="done",
            finished_at=utcnow(),
            processed_items=processed_items,
            total_items=total_items,
            lease_owner=None,
            lease_expires_at=None,
            updated_at=utcnow(),
        )

    async def mark_failed(self, *, task_id: int, run_id: str, worker_id: str, error: str) -> bool:
        return await self._update_owned(
            task_id,
            run_id,
            worker_id,
            status="failed",
            finished_at=utcnow(),
            last_error=error,
            lease_owner=None,
            lease_expires_at=None,
            updated_at=utcnow(),
        )

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

    async def _update_owned(self, task_id: int, run_id: str, worker_id: str, **values) -> bool:
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
