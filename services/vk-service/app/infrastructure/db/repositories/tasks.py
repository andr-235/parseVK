import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.tasks import VkTaskRun as VkTaskRunEntity
from app.infrastructure.db.models.tasks import ProcessedEvent, VkTaskRun
from app.domain.repositories.tasks import TaskEventsRepository


def utcnow() -> datetime:
    return datetime.now(UTC)


def _to_task_run_entity(model: VkTaskRun) -> VkTaskRunEntity:
    return VkTaskRunEntity(
        id=model.id,
        task_id=model.task_id,
        owner_user_id=model.owner_user_id,
        run_id=model.run_id,
        status=model.status,
        scope=model.scope,
        mode=model.mode,
        group_ids=list(model.group_ids),
        post_limit=model.post_limit,
        started_at=model.started_at,
        finished_at=model.finished_at,
        processed_items=model.processed_items,
        total_items=model.total_items,
        last_error=model.last_error,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


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

    async def mark_processed(self, consumer_name: str, event_id: uuid.UUID, event_type: str) -> None:
        stmt = pg_insert(ProcessedEvent).values(
            consumer_name=consumer_name,
            event_id=event_id,
            event_type=event_type,
            processed_at=utcnow(),
        ).on_conflict_do_update(
            constraint="uq_processed_events_consumer_event",
            set_={"processed_at": utcnow(), "retry_count": 0, "last_error": None, "next_retry_at": None},
        )
        await self.session.execute(stmt)

    async def get_task_run(self, task_id: int) -> VkTaskRunEntity | None:
        model = await self.session.scalar(
            select(VkTaskRun).where(VkTaskRun.task_id == task_id)
        )
        return _to_task_run_entity(model) if model is not None else None

    async def create_task_run(
        self,
        task_id: int,
        owner_user_id: str,
        run_id: str,
        scope: str,
        mode: str,
        group_ids: list[int],
        post_limit: int | None = None,
    ) -> VkTaskRunEntity:
        task_run = VkTaskRun(
            task_id=task_id,
            owner_user_id=owner_user_id,
            run_id=run_id,
            status="pending",
            scope=scope,
            mode=mode,
            group_ids=group_ids,
            post_limit=post_limit,
        )
        self.session.add(task_run)
        await self.session.flush()
        return _to_task_run_entity(task_run)

    async def update_task_run(self, task_id: int, **kwargs) -> VkTaskRunEntity | None:
        model = await self.session.scalar(
            select(VkTaskRun).where(VkTaskRun.task_id == task_id)
        )
        if model is None:
            return None
        for key, value in kwargs.items():
            setattr(model, key, value)
        await self.session.flush()
        return _to_task_run_entity(model)

    async def save(self) -> None:
        await self.session.flush()
