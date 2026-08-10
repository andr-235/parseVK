from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta

from prometheus_client import Counter
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.infrastructure.db.repositories.ingestion_payload_purge import (
    purge_eligible_batches,
)

PURGE_OUTCOMES = Counter(
    "vk_ingestion_payload_purge_total",
    "Applied staged ingestion payload purge outcomes",
    ["outcome"],
)


async def purge_ingestion_payloads_once(
    session_factory: async_sessionmaker,
) -> int:
    now = datetime.now(UTC)
    cutoff = now - timedelta(seconds=settings.ingestion_payload_purge_grace_seconds)
    async with session_factory() as session:
        async with session.begin():
            purged = await purge_eligible_batches(
                session,
                older_than=cutoff,
                limit=settings.ingestion_payload_purge_batch_size,
                purged_at=now,
            )
    if purged:
        PURGE_OUTCOMES.labels(outcome="purged").inc(purged)
    return purged


async def purge_ingestion_payloads_forever(
    session_factory: async_sessionmaker,
) -> None:
    while True:
        await purge_ingestion_payloads_once(session_factory)
        await asyncio.sleep(settings.ingestion_payload_purge_poll_seconds)
