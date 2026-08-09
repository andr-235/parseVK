"""Content-service outbox repository for durable projection events.

Implements SQLAlchemy-based row locking and state transitions for
ContentOutboxEvent rows. The repository is consumed by the shared
OutboxPublisher through the ContentOutboxRepositoryAdapter.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ContentOutboxEvent, utcnow

MAX_OUTBOX_ATTEMPTS = 5


class OutboxRepository:
    """Repository for content_outbox_events: claim, publish, retry, DLQ."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def lock_pending(self, limit: int = 100) -> list[ContentOutboxEvent]:
        """Claim pending rows with SELECT ... FOR UPDATE SKIP LOCKED."""
        result = await self.session.scalars(
            select(ContentOutboxEvent)
            .where(
                ContentOutboxEvent.status == "pending",
                ContentOutboxEvent.next_attempt_at <= utcnow(),
            )
            .order_by(ContentOutboxEvent.created_at.asc())
            .with_for_update(skip_locked=True)
            .limit(limit)
        )
        events = list(result)
        for event in events:
            event.locked_at = utcnow()
        await self.session.flush()
        return events

    async def pending_stats(self) -> tuple[int, datetime | None]:
        row = (
            await self.session.execute(
                select(
                    func.count(ContentOutboxEvent.id),
                    func.min(ContentOutboxEvent.created_at),
                ).where(ContentOutboxEvent.status == "pending")
            )
        ).one()
        return int(row[0] or 0), row[1]

    async def mark_published(self, event: ContentOutboxEvent) -> None:
        event.status = "published"
        event.published_at = utcnow()
        event.locked_at = None
        await self.session.flush()

    async def mark_failed(self, event: ContentOutboxEvent, error: str, *, max_attempts: int = MAX_OUTBOX_ATTEMPTS) -> None:
        event.attempts += 1
        event.last_error = error
        event.locked_at = None
        if event.attempts >= max_attempts:
            event.status = "failed"
        else:
            event.next_attempt_at = utcnow() + timedelta(seconds=min(2**event.attempts, 300))
        await self.session.flush()

    async def get(self, event_id: UUID) -> ContentOutboxEvent | None:
        return await self.session.get(ContentOutboxEvent, event_id)
