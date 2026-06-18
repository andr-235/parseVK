from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import OutboxEvent


def utcnow() -> datetime:
    return datetime.now(UTC)


class OutboxRepository:
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
        dedupe_key: str | None = None,
    ) -> None:
        stmt = insert(OutboxEvent).values(
            id=uuid4(),
            event_type=event_type,
            event_version=1,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            correlation_id=correlation_id,
            dedupe_key=dedupe_key,
            payload=payload,
            status="pending",
            attempts=0,
            next_attempt_at=utcnow(),
            created_at=utcnow(),
        )
        if dedupe_key:
            stmt = stmt.on_conflict_do_nothing(
                index_elements=[OutboxEvent.dedupe_key],
                index_where=text("dedupe_key IS NOT NULL"),
            )
        await self.session.execute(stmt)

    async def list_pending(self, *, limit: int = 100) -> list[OutboxEvent]:
        result = await self.session.scalars(
            select(OutboxEvent)
            .where(OutboxEvent.status == "pending", OutboxEvent.next_attempt_at <= utcnow())
            .order_by(OutboxEvent.created_at.asc())
            .limit(limit)
        )
        return list(result)

    async def mark_published(self, event: OutboxEvent) -> None:
        event.status = "published"
        event.published_at = utcnow()
        await self.session.flush()
