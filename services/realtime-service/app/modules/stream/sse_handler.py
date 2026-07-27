"""SSE streaming endpoint with replay and live polling."""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import UTC, datetime

from prometheus_client import Counter, Gauge
from sqlalchemy import text

from app.core.config import settings

logger = logging.getLogger(__name__)

# Metrics
try:
    connected_clients = Gauge("realtime_connected_clients", "Active SSE connections")
    replayed_total = Counter("realtime_replayed_events_total", "Replayed events")
    resync_total = Counter("realtime_resync_required_total", "Resync required sent")
    slow_clients_dropped_total = Counter("realtime_slow_clients_dropped_total", "Slow clients dropped")
except ValueError:
    from prometheus_client.registry import REGISTRY
    connected_clients = REGISTRY._names_to_collectors.get("realtime_connected_clients")
    replayed_total = REGISTRY._names_to_collectors.get("realtime_replayed_events_total")
    resync_total = REGISTRY._names_to_collectors.get("realtime_resync_required_total")
    slow_clients_dropped_total = REGISTRY._names_to_collectors.get("realtime_slow_clients_dropped_total")

HEARTBEAT_INTERVAL = settings.sse_heartbeat_seconds
MAX_QUEUE_SIZE = settings.max_send_queue_size
POLL_INTERVAL = 0.5  # 500ms


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


async def stream_events(session_factory, last_event_id: int | None, audience_types: list[str] | None, audience_id: str | None, x_user_id: str | None = None):
    """
    Async generator for SSE streaming.

    Phase 1: Replay past events from DB (if lastEventId provided).
    Phase 2: Poll for new events every 500ms, send heartbeats every 15s.

    If x_user_id is provided (e.g. from the gateway), it overrides audience_id.
    """
    effective_audience_id = x_user_id if x_user_id is not None else audience_id
    local_last_seen = last_event_id or 0

    # ── Phase 1: Replay ──
    if last_event_id and last_event_id > 0:
        async with session_factory() as session:
            result = await session.execute(
                text("SELECT MIN(sequence_id), MAX(sequence_id) FROM realtime_events")
            )
            row = result.one()
            min_seq = row[0]
            max_seq = row[1]

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

        events = await _query_events_after(session_factory, last_event_id, audience_types, effective_audience_id)
        for event in events:
            yield _format_sse(
                event_id=str(event["sequence_id"]),
                event_type=event["event_type"],
                data=event["payload"],
            )
            local_last_seen = event["sequence_id"]
            replayed_total.inc()

        logger.debug("Replayed %d events from seq=%d", len(events), last_event_id)

    # ── Phase 2: Live streaming via polling ──
    connected_clients.inc()
    client_id = id(session_factory)
    logger.info("SSE client connected id=%s", client_id)

    try:
        send_queue: asyncio.Queue[dict] = asyncio.Queue(maxsize=MAX_QUEUE_SIZE)

        async def poll_worker():
            """Poll for new events and push to send queue."""
            while True:
                await asyncio.sleep(POLL_INTERVAL)
                try:
                    events = await _query_events_after(
                        session_factory, local_last_seen, audience_types, effective_audience_id, limit=100,
                    )
                    for event in events:
                        try:
                            await asyncio.wait_for(send_queue.put(event), timeout=1.0)
                        except asyncio.TimeoutError:
                            logger.warning("Send queue full for client id=%s, dropping", client_id)
                            slow_clients_dropped_total.inc()
                            return
                except asyncio.CancelledError:
                    return
                except Exception as exc:
                    logger.error("Poll worker error id=%s: %s", client_id, exc)

        poll_task = asyncio.create_task(poll_worker())
        last_heartbeat = datetime.now(UTC)

        try:
            while True:
                # Check for new events with timeout to allow heartbeat interleaving
                try:
                    event = await asyncio.wait_for(send_queue.get(), timeout=1.0)
                    yield _format_sse(
                        event_id=str(event["sequence_id"]),
                        event_type=event["event_type"],
                        data=event["payload"],
                    )
                    local_last_seen = event["sequence_id"]
                except asyncio.TimeoutError:
                    pass

                # Heartbeat
                now = datetime.now(UTC)
                if (now - last_heartbeat).total_seconds() >= HEARTBEAT_INTERVAL:
                    yield _format_heartbeat()
                    last_heartbeat = now

        finally:
            poll_task.cancel()
            try:
                await poll_task
            except asyncio.CancelledError:
                pass

    finally:
        connected_clients.dec()
        logger.info("SSE client disconnected id=%s", client_id)
