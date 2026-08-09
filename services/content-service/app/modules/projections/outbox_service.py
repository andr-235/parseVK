"""Content-service transactional outbox writer."""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ContentOutboxEvent

logger = logging.getLogger(__name__)


class ContentOutboxService:
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
        event_id: UUID | None = None,
    ) -> None:
        now = datetime.now(UTC)
        stmt = insert(ContentOutboxEvent).values(
            id=event_id or uuid4(),
            event_type=event_type,
            event_version=event_version,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            correlation_id=correlation_id,
            dedupe_key=dedupe_key,
            payload=payload,
            status="pending",
            attempts=0,
            next_attempt_at=now,
            created_at=now,
        )
        if dedupe_key:
            stmt = stmt.on_conflict_do_nothing(
                index_elements=[ContentOutboxEvent.dedupe_key],
                index_where=text("dedupe_key IS NOT NULL"),
            )
        await self.session.execute(stmt)
        logger.debug("Added outbox event type=%s aggregate=%s", event_type, aggregate_id)
