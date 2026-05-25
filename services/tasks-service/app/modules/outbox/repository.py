from datetime import timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import OutboxEvent, utcnow


class OutboxRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def lock_pending(self, limit: int = 100) -> list[OutboxEvent]:
        result = await self.session.scalars(
            select(OutboxEvent)
            .where(OutboxEvent.status == "pending", OutboxEvent.next_attempt_at <= utcnow())
            .order_by(OutboxEvent.created_at.asc())
            .with_for_update(skip_locked=True)
            .limit(limit)
        )
        events = list(result)
        for event in events:
            event.locked_at = utcnow()
        await self.session.flush()
        return events

    async def mark_published(self, event: OutboxEvent) -> None:
        event.status = "published"
        event.published_at = utcnow()
        event.locked_at = None
        await self.session.flush()

    async def mark_failed(self, event: OutboxEvent, error: str, *, max_attempts: int = 5) -> None:
        event.attempts += 1
        event.last_error = error
        event.locked_at = None
        if event.attempts >= max_attempts:
            event.status = "failed"
        else:
            event.next_attempt_at = utcnow() + timedelta(seconds=min(2**event.attempts, 300))
        await self.session.flush()

    async def get(self, event_id: UUID) -> OutboxEvent | None:
        return await self.session.get(OutboxEvent, event_id)
