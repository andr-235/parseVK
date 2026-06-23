import logging
from datetime import UTC, datetime
from uuid import UUID

from common.events import ImEvent
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ImMessage, ProcessedEvent

CONSUMER_NAME = "content-service.im"

logger = logging.getLogger(__name__)


def utcnow() -> datetime:
    return datetime.now(UTC)


class ImEventRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def is_processed(self, consumer_name: str, event_id: UUID) -> bool:
        return (
            await self.session.scalar(
                select(ProcessedEvent.id).where(
                    ProcessedEvent.consumer_name == consumer_name,
                    ProcessedEvent.event_id == event_id,
                )
            )
            is not None
        )

    async def mark_processed(self, consumer_name: str, event_id: UUID, event_type: str) -> None:
        stmt = pg_insert(ProcessedEvent).values(
            consumer_name=consumer_name, event_id=event_id, event_type=event_type, processed_at=utcnow(),
        ).on_conflict_do_update(
            constraint="uq_processed_events_consumer_event",
            set_={"processed_at": utcnow(), "retry_count": 0, "last_error": None, "next_retry_at": None},
        )
        await self.session.execute(stmt)

    async def upsert_message(self, messenger: str, message_id: str, chat_id: str) -> None:
        from sqlalchemy.dialects.postgresql import insert

        stmt = insert(ImMessage).values(
            messenger=messenger,
            external_id=message_id,
            chat_external_id=chat_id,
            ingested_at=utcnow(),
        ).on_conflict_do_nothing(index_elements=[ImMessage.id])
        await self.session.execute(stmt)

    async def save(self) -> None:
        await self.session.flush()


class ImEventService:
    def __init__(self, repository, *, consumer_name: str = CONSUMER_NAME):
        self.repository = repository
        self.consumer_name = consumer_name

    async def handle(self, event: ImEvent) -> bool:
        if await self.repository.is_processed(self.consumer_name, event.event_id):
            return False

        if event.event_type == "im.message_collected":
            payload = event.payload
            await self.repository.upsert_message(
                messenger=payload["messenger"],
                message_id=payload["messageId"],
                chat_id=payload["chatId"],
            )
        elif event.event_type == "im.group_collected":
            logger.info("Group collected: %s", event.payload)

        await self.repository.mark_processed(self.consumer_name, event.event_id, event.event_type)
        await self.repository.save()
        return True
