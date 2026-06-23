import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

logger = logging.getLogger(__name__)


class ProcessedEventRepository:
    def __init__(self, model_class, consumer_name: str):
        self.model = model_class
        self.consumer_name = consumer_name

    async def get_event(self, session, event_id: str):
        return await session.scalar(
            select(self.model).where(
                self.model.consumer_name == self.consumer_name,
                self.model.event_id == event_id,
            )
        )

    async def get_retry_count(self, session, event_id: str) -> int | None:
        return await session.scalar(
            select(self.model.retry_count).where(
                self.model.consumer_name == self.consumer_name,
                self.model.event_id == event_id,
            )
        )

    async def upsert_retry(self, session, event_id: str, event_type: str, error: str, next_retry_at: datetime, now: datetime) -> None:
        stmt = pg_insert(self.model).values(
            consumer_name=self.consumer_name,
            event_id=event_id,
            event_type=event_type,
            processed_at=now,
            retry_count=1,
            last_error=error,
            next_retry_at=next_retry_at,
        )
        stmt = stmt.on_conflict_do_update(
            constraint="uq_processed_events_consumer_event",
            set_={
                "retry_count": self.model.retry_count + 1,
                "last_error": stmt.excluded.last_error,
                "next_retry_at": stmt.excluded.next_retry_at,
            },
        )
        await session.execute(stmt)
