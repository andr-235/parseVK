"""Shared LISTEN/NOTIFY listener for realtime events.

Maintains a single asyncpg connection that listens on the 'realtime_events'
channel. Subscribers register callbacks that are called when new events arrive.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
from collections.abc import Callable

import asyncpg

logger = logging.getLogger(__name__)


class RealtimeListener:
    """Shared LISTEN/NOTIFY listener with subscriber callbacks."""

    def __init__(self, dsn: str):
        self._dsn = dsn
        self._conn: asyncpg.Connection | None = None
        self._subscribers: dict[str, list[Callable[[int], None]]] = {}
        self._task: asyncio.Task | None = None
        self._stopped = asyncio.Event()

    async def start(self):
        if self._conn is not None and not self._conn.is_closed():
            logger.warning("RealtimeListener already started")
            return
        self._conn = await asyncpg.connect(self._dsn)
        await self._conn.add_listener("realtime_events", self._on_notification)
        logger.info("LISTEN realtime_events started")
        # Keep connection alive with periodic ping
        self._stopped.clear()
        self._task = asyncio.create_task(self._ping_loop())

    async def stop(self):
        self._stopped.set()
        if self._task:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
            self._task = None
        if self._conn:
            await self._conn.remove_listener("realtime_events", self._on_notification)
            await self._conn.close()
            self._conn = None
        logger.info("LISTEN realtime_events stopped")

    def subscribe(self, subscriber_id: str, callback: Callable[[int], None]):
        self._subscribers.setdefault(subscriber_id, []).append(callback)

    def unsubscribe(self, subscriber_id: str):
        self._subscribers.pop(subscriber_id, None)

    def _on_notification(self, connection, pid, channel, payload):
        """Called when pg_notify fires. payload is the sequence_id as text."""
        try:
            seq = int(payload)
        except (ValueError, TypeError):
            logger.warning("Invalid notification payload: %s", payload)
            return
        for subscriber_id, callbacks in list(self._subscribers.items()):
            for cb in callbacks:
                try:
                    cb(seq)
                except Exception:
                    logger.exception("Subscriber %s callback failed", subscriber_id)

    async def _ping_loop(self):
        """Periodic ping to keep the connection alive."""
        while not self._stopped.is_set():
            await asyncio.sleep(30)
            if self._conn and not self._conn.is_closed():
                try:
                    await self._conn.execute("SELECT 1")
                except Exception:
                    logger.warning("Listener ping failed, reconnecting...")
                    try:
                        await self._reconnect()
                    except Exception:
                        logger.exception("Listener reconnect failed")

    async def _reconnect(self):
        """Reconnect the listener while preserving the ping task."""
        logger.info("Reconnecting realtime listener...")
        if self._conn:
            try:
                await self._conn.remove_listener("realtime_events", self._on_notification)
                await self._conn.close()
            except Exception:
                logger.exception("Error closing old listener connection")
        self._conn = await asyncpg.connect(self._dsn)
        await self._conn.add_listener("realtime_events", self._on_notification)
        logger.info("LISTEN realtime_events reconnected")
