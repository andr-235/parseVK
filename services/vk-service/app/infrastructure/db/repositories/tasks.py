import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.repositories.tasks import TaskEventsRepository
from app.infrastructure.db.models.tasks import ProcessedEvent


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
