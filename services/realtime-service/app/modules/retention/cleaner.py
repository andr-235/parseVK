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

# Last known maximum sequence_id observed by safety_catchup.
_last_sequence_id: int | None = None


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
    """Safety catch-up: detect missed notifications and wake listeners.

    Compares the current MAX(sequence_id) with the last observed cursor. If
    new events appeared that the shared LISTEN/NOTIFY listener may have missed
    (e.g. after a reconnect), the function emits pg_notify with the latest
    sequence_id so all subscribers re-query the database and catch up.

    Returns the current maximum sequence_id (or 0 if the table is empty).
    """
    global _last_sequence_id

    async with session_factory() as session:
        max_seq = await session.scalar(text("SELECT MAX(sequence_id) FROM realtime_events"))
        if max_seq is None:
            return 0

        if _last_sequence_id is not None and max_seq > _last_sequence_id:
            gap = max_seq - _last_sequence_id
            catchup_total.inc(gap)
            logger.warning(
                "Safety catch-up: detected %d missed events (cursor=%d, max=%d), waking listeners",
                gap, _last_sequence_id, max_seq,
            )
            await session.execute(
                text("SELECT pg_notify('realtime_events', :seq)"),
                {"seq": str(max_seq)},
            )
        elif _last_sequence_id is None:
            logger.debug("Safety catch-up: initialized cursor at %d", max_seq)

        _last_sequence_id = max_seq
        return max_seq


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
