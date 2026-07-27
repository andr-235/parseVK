"""SSE streaming endpoint with replay and live polling."""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import UTC, datetime
from uuid import uuid4

from prometheus_client import Counter, Gauge
from sqlalchemy import text

from app.core.config import settings

logger = logging.getLogger(__name__)

# Metrics
try:
    connected_clients = Gauge("realtime_connected_clients", "Active SSE connections")
    replayed_total = Counter("realtime_replayed_events_total", "Replayed events")
    resync_total = Counter("realtime_resync_required_total", "Resync required sent")
except ValueError:
    from prometheus_client.registry import REGISTRY
    connected_clients = REGISTRY._names_to_collectors.get("realtime_connected_clients")
    replayed_total = REGISTRY._names_to_collectors.get("realtime_replayed_events_total")
    resync_total = REGISTRY._names_to_collectors.get("realtime_resync_required_total")

HEARTBEAT_INTERVAL = settings.sse_heartbeat_seconds
POLL_INTERVAL = 5.0  # 5s safety timeout when no listener notification arrives


def _format_sse(event_id: str, event_type: str, data: dict) -> str:
    return "\n".join([
        f"id: {event_id}",
        f"event: {event_type}",
        f"data: {json.dumps(data, default=str)}",
        "",
    ])


def _format_heartbeat() -> str:
    return ": heartbeat\n\n"


async def _query_events_after(session_factory, last_seq: int, audience_types: list[str] | None, audience_id: str | None, limit: int = 1000) -> list[dict]:
    """Fetch events after a sequence_id filtered by audience."""
    async with session_factory() as session:
        conditions = ["r.sequence_id > :last_seq"]
        params = {"last_seq": last_seq, "limit": limit}

        if audience_types:
            placeholders = [f":audience_type_{i}" for i in range(len(audience_types))]
            conditions.append(f"r.audience_type IN ({', '.join(placeholders)})")
            for i, at in enumerate(audience_types):
                params[f"audience_type_{i}"] = at
        if audience_id is not None:
            conditions.append("(r.audience_id = :audience_id OR r.audience_id IS NULL)")
            params["audience_id"] = audience_id
        else:
            conditions.append("r.audience_id IS NULL")

        where = " AND ".join(conditions)
        query = text(f"""
            SELECT r.sequence_id, r.event_id, r.event_type, r.event_version,
                   r.source_topic, r.payload, r.created_at
            FROM realtime_events r
            WHERE {where}
            ORDER BY r.sequence_id ASC
            LIMIT :limit
        """)
        result = await session.execute(query, params)
        rows = result.mappings().all()

        return [{
            "sequence_id": r["sequence_id"],
            "event_id": str(r["event_id"]),
            "event_type": r["event_type"],
            "payload": r["payload"],
        } for r in rows]


async def stream_events(
    session_factory,
    last_event_id: int | None,
    audience_types: list[str] | None,
    audience_id: str | None,
    x_user_id: str | None = None,
    listener=None,
):
    """
    Async generator for SSE streaming.

    Phase 1: Replay past events from DB (if lastEventId provided).
    Phase 2: Subscribe to the shared LISTEN/NOTIFY listener and query for new
             events on each notification, with a 5s safety timeout.

    If x_user_id is provided (e.g. from the gateway), it overrides audience_id.
    """
    effective_audience_id = x_user_id if x_user_id is not None else audience_id
    local_last_seen = 0

    # ── Phase 1: Replay ──
    async with session_factory() as session:
        result = await session.execute(
            text("SELECT MIN(sequence_id), COALESCE(MAX(sequence_id), 0) FROM realtime_events")
        )
        row = result.one()
        min_seq = row[0]
        max_seq = row[1]

    if last_event_id is None:
        last_event_id = max_seq

    local_last_seen = last_event_id

    if last_event_id > 0:
        if max_seq is not None and last_event_id > max_seq:
            yield _format_sse(
                event_id=str(max_seq),
                event_type="resync_required",
                data={"type": "resync_required", "cursor": max_seq},
            )
            resync_total.inc()
            logger.info("Cursor %d ahead of latest (latest=%d), sent resync_required", last_event_id, max_seq)
            return

        if min_seq is not None and last_event_id < min_seq - 1:
            yield _format_sse(
                event_id=str(max_seq),
                event_type="resync_required",
                data={"type": "resync_required", "cursor": max_seq},
            )
            resync_total.inc()
            logger.info("Cursor %d expired (retention=%d..%d), sent resync_required", last_event_id, min_seq, max_seq)
            return

        if last_event_id < max_seq:
            events = await _query_events_after(session_factory, last_event_id, audience_types, effective_audience_id, limit=1000)
            for event in events:
                yield _format_sse(
                    event_id=str(event["sequence_id"]),
                    event_type=event["event_type"],
                    data=event["payload"],
                )
                local_last_seen = event["sequence_id"]
                replayed_total.inc()

            logger.debug("Replayed %d events from seq=%d", len(events), last_event_id)

    # ── Phase 2: Live streaming via LISTEN/NOTIFY ──
    connected_clients.inc()
    client_id = uuid4()
    logger.info("SSE client connected id=%s", client_id)

    try:
        notify_queue: asyncio.Queue[int] = asyncio.Queue()
        subscriber_id = f"sse-{client_id}"

        def on_notify(seq: int):
            try:
                notify_queue.put_nowait(seq)
            except asyncio.QueueFull:
                logger.warning("Notify queue full for client id=%s, dropping", client_id)

        if listener is not None:
            listener.subscribe(subscriber_id, on_notify)

        last_heartbeat = datetime.now(UTC)

        try:
            while True:
                # Wait for a notification (or safety timeout) then query for new events.
                # The notification is only a wake-up signal; the DB query is the source
                # of truth and handles missed or batched notifications.
                if listener is not None:
                    try:
                        await asyncio.wait_for(notify_queue.get(), timeout=POLL_INTERVAL)
                    except asyncio.TimeoutError:
                        pass
                else:
                    # Fallback when no listener is provided (e.g. isolated tests).
                    await asyncio.sleep(POLL_INTERVAL)

                events = await _query_events_after(
                    session_factory,
                    local_last_seen,
                    audience_types,
                    effective_audience_id,
                    limit=100,
                )

                for event in events:
                    yield _format_sse(
                        event_id=str(event["sequence_id"]),
                        event_type=event["event_type"],
                        data=event["payload"],
                    )
                    local_last_seen = event["sequence_id"]

                # Heartbeat
                now = datetime.now(UTC)
                if (now - last_heartbeat).total_seconds() >= HEARTBEAT_INTERVAL:
                    yield _format_heartbeat()
                    last_heartbeat = now

        finally:
            if listener is not None:
                listener.unsubscribe(subscriber_id)

    finally:
        connected_clients.dec()
        logger.info("SSE client disconnected id=%s", client_id)
