from datetime import timedelta, UTC, datetime
from uuid import UUID

from app.db.models import OUTBOX_FAILED, OUTBOX_PENDING, OUTBOX_PUBLISHED, OutboxEvent, utc_now
from common.events import EventEnvelope
from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

MAX_OUTBOX_ATTEMPTS = 5


async def add_event(
    session: AsyncSession,
    event: EventEnvelope,
    *,
    aggregate_type: str,
    aggregate_id: str,
    dedupe_key: str | None = None,
) -> None:
    stmt = insert(OutboxEvent).values(
        id=event.event_id,
        event_type=event.event_type,
        event_version=event.event_version,
        aggregate_type=aggregate_type,
        aggregate_id=aggregate_id,
        correlation_id=event.correlation_id,
        dedupe_key=dedupe_key,
        payload=event.model_dump(mode="json"),
        status=OUTBOX_PENDING,
        attempts=0,
        next_attempt_at=datetime.now(UTC),
        created_at=datetime.now(UTC),
    )
    if dedupe_key:
        stmt = stmt.on_conflict_do_nothing(
            index_elements=[OutboxEvent.dedupe_key],
            index_where=text("dedupe_key IS NOT NULL"),
        )
    await session.execute(stmt)


async def lock_pending_batch(session: AsyncSession, limit: int = 100) -> list[OutboxEvent]:
    statement = (
        select(OutboxEvent)
        .where(OutboxEvent.status == OUTBOX_PENDING, OutboxEvent.next_attempt_at <= utc_now())
        .order_by(OutboxEvent.created_at)
        .limit(limit)
        .with_for_update(skip_locked=True)
    )
    events = await session.scalars(statement)
    batch = list(events)
    now = utc_now()
    for event in batch:
        event.locked_at = now
    return batch


async def mark_published(session: AsyncSession, event_id: UUID) -> None:
    event = await session.get(OutboxEvent, event_id)
    if not event:
        return
    event.status = OUTBOX_PUBLISHED
    event.published_at = utc_now()
    event.locked_at = None
    event.last_error = None


async def mark_failed_or_retry(session: AsyncSession, event_id: UUID, error: str) -> None:
    event = await session.get(OutboxEvent, event_id)
    if not event:
        return
    event.attempts += 1
    event.last_error = error
    event.locked_at = None
    if event.attempts >= MAX_OUTBOX_ATTEMPTS:
        event.status = OUTBOX_FAILED
        return
    event.status = OUTBOX_PENDING
    event.next_attempt_at = utc_now() + timedelta(seconds=2**event.attempts)
