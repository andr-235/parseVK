import uuid
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import desc, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.executions import TERMINAL_EXECUTION_STATUSES
from app.domain.repositories.tasks import TaskEventsRepository
from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.models.tasks import ProcessedEvent
from app.infrastructure.db.repositories.executions import _execution_entity


def utcnow() -> datetime:
    return datetime.now(UTC)


class SqlAlchemyTaskEventsRepository(TaskEventsRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def is_processed(self, consumer_name: str, event_id: uuid.UUID) -> bool:
        return (
            await self.session.scalar(
                select(ProcessedEvent.id).where(
                    ProcessedEvent.consumer_name == consumer_name,
                    ProcessedEvent.event_id == event_id,
                )
            )
            is not None
        )

    async def mark_processed(
        self, consumer_name: str, event_id: uuid.UUID, event_type: str
    ) -> None:
        stmt = (
            pg_insert(ProcessedEvent)
            .values(
                consumer_name=consumer_name,
                event_id=event_id,
                event_type=event_type,
                processed_at=utcnow(),
            )
            .on_conflict_do_update(
                constraint="uq_processed_events_consumer_event",
                set_={
                    "processed_at": utcnow(),
                    "retry_count": 0,
                    "last_error": None,
                    "next_retry_at": None,
                },
            )
        )
        await self.session.execute(stmt)

    async def get_execution(self, task_id: int, run_id: str):
        model = await self.session.scalar(
            select(VkExecution).where(
                VkExecution.task_id == task_id,
                VkExecution.run_id == run_id,
            )
        )
        return _execution_entity(model) if model is not None else None

    async def get_active_execution(self, task_id: int):
        model = await self.session.scalar(
            select(VkExecution)
            .where(
                VkExecution.task_id == task_id,
                VkExecution.status.in_(("pending", "running")),
            )
            .order_by(desc(VkExecution.created_at))
            .limit(1)
        )
        return _execution_entity(model) if model is not None else None

    async def get_latest_execution(self, task_id: int):
        model = await self.session.scalar(
            select(VkExecution)
            .where(VkExecution.task_id == task_id)
            .order_by(desc(VkExecution.created_at))
            .limit(1)
        )
        return _execution_entity(model) if model is not None else None

    async def create_execution(
        self,
        *,
        task_id: int,
        owner_user_id: str,
        run_id: str,
        scope: str,
        mode: str,
        group_ids: list[int],
        post_limit: int | None,
        plan_snapshot: dict,
        parent_execution_id: UUID | None,
    ):
        model = VkExecution(
            task_id=task_id,
            owner_user_id=owner_user_id,
            run_id=run_id,
            status="pending",
            scope=scope,
            mode=mode,
            group_ids=group_ids,
            post_limit=post_limit,
            plan_snapshot=plan_snapshot,
            parent_execution_id=parent_execution_id,
        )
        self.session.add(model)
        await self.session.flush()
        return _execution_entity(model)

    async def request_cancellation(
        self, *, task_id: int, run_id: str | None, reason: str
    ):
        stmt = select(VkExecution).where(
            VkExecution.task_id == task_id,
            VkExecution.status.in_(("pending", "running")),
        )
        if run_id:
            stmt = stmt.where(VkExecution.run_id == run_id)
        model = await self.session.scalar(
            stmt.order_by(desc(VkExecution.created_at)).with_for_update().limit(1)
        )
        if model is None:
            return None
        now = utcnow()
        if model.cancellation_requested_at is None:
            model.cancellation_requested_at = now
            model.cancellation_reason = reason[:2000]
        if model.status == "pending":
            model.status = "cancelled"
            model.finished_at = now
            model.last_error = reason[:2000]
        model.updated_at = now
        await self.session.flush()
        return _execution_entity(model)

    async def fail_pending(self, execution_id: UUID, error: str) -> bool:
        model = await self.session.scalar(
            select(VkExecution)
            .where(VkExecution.id == execution_id)
            .with_for_update()
        )
        if model is None or model.status in TERMINAL_EXECUTION_STATUSES:
            return False
        now = utcnow()
        model.status = "failed"
        model.finished_at = now
        model.last_error = error[:2000]
        model.updated_at = now
        await self.session.flush()
        return True
