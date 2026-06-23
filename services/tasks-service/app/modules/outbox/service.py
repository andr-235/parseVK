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
        stmt = insert(OutboxEvent).values(
            id=uuid4(),
            event_type=event_type,
            event_version=event_version,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            correlation_id=correlation_id,
            dedupe_key=dedupe_key,
            payload=payload,
            status="pending",
            attempts=0,
            next_attempt_at=datetime.now(UTC),
            created_at=datetime.now(UTC),
        )
        if dedupe_key:
            stmt = stmt.on_conflict_do_nothing(
                index_elements=[OutboxEvent.dedupe_key],
                index_where=text("dedupe_key IS NOT NULL"),
            )
        await self.session.execute(stmt)
