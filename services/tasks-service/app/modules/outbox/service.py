from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import OutboxEvent


class OutboxService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add_event(
        self,
        *,
        event_type: str,
        aggregate_type: str,
        aggregate_id: str,
        payload: dict,
        correlation_id: str | None = None,
        event_version: int = 1,
    ) -> OutboxEvent:
        event = OutboxEvent(
            event_type=event_type,
            event_version=event_version,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            correlation_id=correlation_id,
            payload=payload,
        )
        self.session.add(event)
        await self.session.flush()
        await self.session.refresh(event)
        return event
