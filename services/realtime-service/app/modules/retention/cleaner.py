"""Retention cleanup and safety catch-up for the realtime-service."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from prometheus_client import Counter
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

# Metrics
try:
    cleaned_total = Counter("realtime_cleaned_total", "Total stale events removed by retention")
    catchup_total = Counter("realtime_catchup_total", "Total missed events recovered by safety catch-up")
except ValueError:
    from prometheus_client.registry import REGISTRY
    cleaned_total = REGISTRY._names_to_collectors.get("realtime_cleaned_total")
    catchup_total = REGISTRY._names_to_collectors.get("realtime_catchup_total")

RETENTION_HOURS = settings.retention_hours
CATCHUP_INTERVAL = settings.safety_catchup_seconds


async def cleanup_expired_events(session_factory: async_sessionmaker) -> int:
    """Delete events with expires_at < now. Returns number of deleted rows."""
    async with session_factory() as session:
        async with session.begin():
            cutoff = datetime.now(UTC)
            result = await session.execute(
                text("DELETE FROM realtime_events WHERE expires_at < :cutoff"),
                {"cutoff": cutoff},
            )
            deleted = result.rowcount
            if deleted > 0:
                cleaned_total.inc(deleted)
                logger.info(
                    "Retention cleanup: removed %d stale events, retention=%dh",
                    deleted, RETENTION_HOURS,
                )
            else:
                logger.debug("Retention cleanup: no stale events to remove")
            return deleted


async def safety_catchup(session_factory: async_sessionmaker) -> int:
    """Safety catch-up: checks how many events exist and logs a metric.

    This serves as a passive monitoring safety net. The actual catch-up 
    logic is embedded in the SSE handler (polling every 500ms). This function
    just logs and reports the total event count for observability.
    Returns the total number of events in the table.
    """
    async with session_factory() as session:
        result = await session.scalar(text("SELECT COUNT(*) FROM realtime_events"))
        count = result or 0
        if count > 0:
            catchup_total.inc(count)
            logger.debug("Safety catch-up: found %d events in realtime_events", count)
        return count


async def retention_loop(session_factory: async_sessionmaker) -> None:
    """Run retention cleanup every 5 minutes."""
    import asyncio
    logger.info("Retention cleanup starting (interval=5min, retention=%dh)", RETENTION_HOURS)
    while True:
        try:
            await cleanup_expired_events(session_factory)
        except Exception as exc:
            logger.error("Retention cleanup failed: %s", exc)
        await asyncio.sleep(300)  # 5 minutes


async def catchup_loop(session_factory: async_sessionmaker) -> None:
    """Run safety catch-up every CATCHUP_INTERVAL seconds."""
    import asyncio
    logger.info("Safety catch-up starting (interval=%ds)", CATCHUP_INTERVAL)
    while True:
        await asyncio.sleep(CATCHUP_INTERVAL)
        try:
            await safety_catchup(session_factory)
        except Exception as exc:
            logger.error("Safety catch-up failed: %s", exc)
