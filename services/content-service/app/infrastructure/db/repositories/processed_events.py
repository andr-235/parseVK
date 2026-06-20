from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models import ProcessedEvent


class SqlAlchemyProcessedEventRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def is_processed(self, consumer_name: str, event_id: UUID) -> bool:
        event = await self.session.scalar(
            select(ProcessedEvent.id).where(
                ProcessedEvent.consumer_name == consumer_name,
                ProcessedEvent.event_id == event_id,
            )
        )
        return event is not None

    async def mark_processed(
        self,
        consumer_name: str,
        event_id: UUID,
        event_type: str,
    ) -> None:
        self.session.add(
            ProcessedEvent(
                consumer_name=consumer_name,
                event_id=event_id,
                event_type=event_type,
            )
        )
