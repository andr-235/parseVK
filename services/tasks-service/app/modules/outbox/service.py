from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert
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
        dedupe_key: str | None = None,
    ) -> None:
        event_id = uuid4()
        stored_dedupe_key = dedupe_key
        if event_type == "task.resumed" and dedupe_key:
            # A run snapshot is intentionally reused across resume attempts.
            # Keep the public event key stable while ensuring every attempt gets
            # a distinct outbox row instead of being dropped by ON CONFLICT.
            stored_dedupe_key = f"{dedupe_key}:{event_id}"

        stmt = insert(OutboxEvent).values(
            id=event_id,
            event_type=event_type,
            event_version=event_version,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            correlation_id=correlation_id,
            dedupe_key=stored_dedupe_key,
            payload=payload,
            status="pending",
            attempts=0,
            next_attempt_at=datetime.now(UTC),
            created_at=datetime.now(UTC),
        )
        if stored_dedupe_key:
            stmt = stmt.on_conflict_do_nothing(
                index_elements=[OutboxEvent.dedupe_key],
                index_where=text("dedupe_key IS NOT NULL"),
            )
        await self.session.execute(stmt)
