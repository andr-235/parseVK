"""Kafka ingestor for realtime-service — inserts events into realtime_events table and sends pg_notify."""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import UTC, datetime, timedelta
from uuid import UUID

from common.events import WireEvent
from prometheus_client import Counter, Gauge
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import settings
from app.db.models import RealtimeEvent

logger = logging.getLogger(__name__)


# Metrics
try:
    ingested_total = Counter("realtime_ingested_total", "Total events ingested from Kafka", ["topic"])
    duplicate_total = Counter("realtime_duplicate_total", "Duplicate events skipped (ON CONFLICT DO NOTHING)", ["topic"])
    ingest_lag = Gauge("realtime_ingest_lag_seconds", "Time between event creation and ingest")
except ValueError:
    from prometheus_client.registry import REGISTRY
    ingested_total = REGISTRY._names_to_collectors.get("realtime_ingested_total")
    duplicate_total = REGISTRY._names_to_collectors.get("realtime_duplicate_total")
    ingest_lag = REGISTRY._names_to_collectors.get("realtime_ingest_lag_seconds")


RETENTION_HOURS = settings.retention_hours


def _calculate_expires_at(created_at: datetime | None = None) -> datetime:
    base = created_at or datetime.now(UTC)
    return base + timedelta(hours=RETENTION_HOURS)


def _map_audience(event_type: str, payload: dict) -> tuple[str, str | None]:
    """Map event_type to (audience_type, audience_id)."""
    if event_type == "content.comments_projected":
        return "authenticated", None
    if event_type == "task.state_changed":
        owner_user_id = payload.get("ownerUserId")
        return "user", str(owner_user_id) if owner_user_id is not None else None
    # Unknown event types are not broadcast until explicitly whitelisted
    logger.warning("Unknown event type '%s' has no audience mapping, skipping", event_type)
    return None, None


async def ingest_event(session: AsyncSession, wire: WireEvent, source_topic: str) -> bool:
    """Insert a single event into realtime_events. Returns True if inserted, False if duplicate/skipped."""
    audience_type, audience_id = _map_audience(wire.event_type, wire.payload)

    if audience_type is None:
        logger.warning("Skipping event id=%s type=%s due to unknown audience", wire.event_id, wire.event_type)
        return False

    created_at = datetime.now(UTC)
    try:
        if wire.created_at:
            created_at = datetime.fromisoformat(wire.created_at.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        pass

    expires_at = _calculate_expires_at(created_at)

    stmt = pg_insert(RealtimeEvent).values(
        event_id=wire.event_id,
        event_type=wire.event_type,
        event_version=wire.event_version,
        source_topic=source_topic,
        source_partition=None,  # Set by caller if available
        source_offset=None,     # Set by caller if available
        audience_type=audience_type,
        audience_id=audience_id,
        aggregate_type=wire.aggregate_type,
        aggregate_id=wire.aggregate_id,
        payload=wire.payload,
        created_at=created_at,
        expires_at=expires_at,
    ).on_conflict_do_nothing(index_elements=[RealtimeEvent.event_id])

    result = await session.execute(stmt)
    inserted = result.rowcount > 0

    if inserted:
        # Get the sequence_id of the inserted row
        seq_result = await session.scalar(
            text("SELECT sequence_id FROM realtime_events WHERE event_id = :eid"),
            {"eid": wire.event_id},
        )
        if seq_result is not None:
            # Send pg_notify
            await session.execute(
                text("SELECT pg_notify('realtime_events', :seq)"),
                {"seq": str(seq_result)},
            )

        # Update lag metric
        lag = (datetime.now(UTC) - created_at).total_seconds()
        ingest_lag.set(max(0, lag))

        logger.debug(
            "Ingested event id=%s type=%s seq=%s lag=%.1fs",
            wire.event_id, wire.event_type, seq_result, lag,
        )
    else:
        logger.debug("Duplicate event id=%s type=%s, skipped", wire.event_id, wire.event_type)

    return inserted


async def consume_topic_forever(
    session_factory: async_sessionmaker,
    topic: str,
    bootstrap_servers: str,
    consumer_group: str,
) -> None:
    """Consume a single Kafka topic forever, inserting events into realtime_events."""
    from aiokafka import AIOKafkaConsumer

    logger.info("Starting Kafka consumer for topic=%s group=%s", topic, consumer_group)

    consumer = AIOKafkaConsumer(
        topic,
        bootstrap_servers=bootstrap_servers,
        group_id=consumer_group,
        auto_offset_reset="earliest",
        enable_auto_commit=False,
    )

    await consumer.start()
    try:
        async for msg in consumer:
            try:
                raw = json.loads(msg.value.decode("utf-8"))
                wire = WireEvent.model_validate(raw)
            except Exception as exc:
                logger.warning("Failed to parse Kafka message from topic=%s: %s", topic, exc)
                await consumer.commit()
                continue

            async with session_factory() as session:
                async with session.begin():
                    try:
                        inserted = await ingest_event(session, wire, topic)
                        if inserted:
                            ingested_total.labels(topic=topic).inc()
                        else:
                            duplicate_total.labels(topic=topic).inc()
                    except Exception as exc:
                        logger.exception(
                            "Failed to ingest event id=%s type=%s: %s",
                            wire.event_id, wire.event_type, exc,
                        )
                        # Still commit offset to avoid infinite retry
            await consumer.commit()

            if msg.partition is not None and msg.offset is not None:
                logger.debug(
                    "Committed offset topic=%s partition=%d offset=%d",
                    topic, msg.partition, msg.offset,
                )
    finally:
        await consumer.stop()
        logger.info("Kafka consumer stopped for topic=%s", topic)
