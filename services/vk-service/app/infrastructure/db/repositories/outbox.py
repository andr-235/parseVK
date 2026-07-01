from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.outbox import OutboxEvent as OutboxEventEntity
from app.infrastructure.db.models.outbox import OutboxEvent
from app.domain.repositories.outbox import OutboxRepository

MAX_OUTBOX_ATTEMPTS = 5


def utcnow() -> datetime:
    return datetime.now(UTC)


def _to_entity(model: OutboxEvent) -> OutboxEventEntity:
    return OutboxEventEntity(
        id=model.id,
        event_type=model.event_type,
        event_version=model.event_version,
        aggregate_type=model.aggregate_type,
        aggregate_id=model.aggregate_id,
        correlation_id=model.correlation_id,
        dedupe_key=model.dedupe_key,
        payload=model.payload,
        status=model.status,
        attempts=model.attempts,
        next_attempt_at=model.next_attempt_at,
        locked_at=model.locked_at,
        published_at=model.published_at,
        last_error=model.last_error,
        created_at=model.created_at,
    )


class SqlAlchemyOutboxRepository(OutboxRepository):
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

    async def list_pending(self, *, limit: int = 100) -> list[OutboxEventEntity]:
        result = await self.session.scalars(
            select(OutboxEvent)
            .where(OutboxEvent.status == "pending", OutboxEvent.next_attempt_at <= utcnow())
            .order_by(OutboxEvent.created_at.asc())
            .limit(limit)
        )
        return [_to_entity(event) for event in result]

    async def lock_pending_batch(self, limit: int = 100) -> list[OutboxEventEntity]:
        result = await self.session.scalars(
            select(OutboxEvent)
            .where(OutboxEvent.status == "pending", OutboxEvent.next_attempt_at <= utcnow())
            .order_by(OutboxEvent.created_at.asc())
            .limit(limit)
            .with_for_update(skip_locked=True)
        )
        batch = list(result)
        now = utcnow()
        for event in batch:
            event.locked_at = now
        await self.session.flush()
        return [_to_entity(event) for event in batch]

    async def mark_published(self, event_id: UUID) -> None:
        event = await self.session.get(OutboxEvent, event_id)
        if event is not None:
            event.status = "published"
            event.published_at = utcnow()
            await self.session.flush()

    async def mark_failed_or_retry(self, event_id: UUID, error: str) -> bool:
        event = await self.session.get(OutboxEvent, event_id)
        if not event:
            return False
        event.attempts += 1
        event.last_error = error
        if event.attempts >= MAX_OUTBOX_ATTEMPTS:
            event.status = "failed"
            await self.session.flush()
            return True
        event.status = "pending"
        event.next_attempt_at = utcnow() + timedelta(seconds=min(2**event.attempts, 300))
        await self.session.flush()
        return False
