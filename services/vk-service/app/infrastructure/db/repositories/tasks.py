import uuid
from datetime import UTC, datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.repositories.tasks import TaskEventsRepository
from app.domain.models.tasks import ProcessedEvent, VkTaskRun

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

    async def mark_processed(self, consumer_name: str, event_id: uuid.UUID, event_type: str) -> None:
        self.session.add(
            ProcessedEvent(
                consumer_name=consumer_name,
                event_id=event_id,
                event_type=event_type,
                processed_at=utcnow(),
            )
        )

    async def get_task_run(self, task_id: int) -> VkTaskRun | None:
        return await self.session.scalar(
            select(VkTaskRun).where(VkTaskRun.task_id == task_id)
        )

    async def create_task_run(
        self,
        task_id: int,
        owner_user_id: str,
        run_id: str,
        scope: str,
        mode: str,
        group_ids: list[int],
        post_limit: int | None = None,
    ) -> VkTaskRun:
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
        return task_run

    async def save(self) -> None:
        await self.session.flush()
