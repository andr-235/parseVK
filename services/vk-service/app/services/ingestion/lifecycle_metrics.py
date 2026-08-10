from __future__ import annotations

from datetime import UTC, datetime

from prometheus_client import Counter, Gauge, Histogram
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch

LIFECYCLE_BACKLOG = Gauge(
    "vk_ingestion_lifecycle_backlog",
    "Durable ingestion lifecycle backlog by state",
    ["state"],
)
LIFECYCLE_OLDEST_AGE = Gauge(
    "vk_ingestion_lifecycle_oldest_age_seconds",
    "Age of the oldest durable ingestion item by state",
    ["state"],
)
ACK_LATENCY = Histogram(
    "vk_ingestion_ack_latency_seconds",
    "Delay from downstream apply to ACK observation in vk-service",
)
PURGE_LATENCY = Histogram(
    "vk_ingestion_payload_purge_latency_seconds",
    "Delay from complete downstream apply to heavy payload purge",
)
BLOCKED_CLEANUP = Counter(
    "vk_ingestion_cleanup_blocked_total",
    "Execution cleanup attempts blocked by retained ingestion batches",
    ["execution_id"],
)
BLOCKED_CLEANUP_OLDEST_AGE = Gauge(
    "vk_ingestion_cleanup_blocked_oldest_age_seconds",
    "Oldest retained batch age for a blocked execution cleanup",
    ["execution_id"],
)


async def observe_lifecycle_snapshot(
    session: AsyncSession,
    *,
    now: datetime,
) -> None:
    specs = (
        ("prepared", VkIngestionStagingBatch.status == "prepared", VkIngestionStagingBatch.created_at),
        ("published", VkIngestionStagingBatch.status == "published", VkIngestionStagingBatch.created_at),
        ("quarantined", VkIngestionStagingBatch.status == "quarantined", VkIngestionStagingBatch.created_at),
        ("failed", VkIngestionStagingBatch.status == "failed", VkIngestionStagingBatch.created_at),
        ("awaiting_purge", VkIngestionStagingBatch.status == "applied", VkIngestionStagingBatch.applied_at),
    )
    for state, predicate, timestamp in specs:
        count, oldest = (
            await session.execute(
                select(func.count(), func.min(timestamp)).where(predicate)
            )
        ).one()
        _set_state(state, int(count), oldest, now)

    count, oldest = (
        await session.execute(
            select(
                func.count(),
                func.min(VkIngestionPartReference.published_at),
            ).where(
                VkIngestionPartReference.status == "published",
                VkIngestionPartReference.ack_event_id.is_(None),
            )
        )
    ).one()
    _set_state("unacknowledged", int(count), oldest, now)


def observe_ack_latency(*, applied_at: datetime, received_at: datetime) -> None:
    ACK_LATENCY.observe(max(0.0, (_aware(received_at) - _aware(applied_at)).total_seconds()))


def observe_purge_latency(*, applied_at: datetime, purged_at: datetime) -> None:
    PURGE_LATENCY.observe(max(0.0, (_aware(purged_at) - _aware(applied_at)).total_seconds()))


def observe_blocked_cleanup(execution_id, blockers: tuple[dict, ...]) -> None:
    label = str(execution_id)
    BLOCKED_CLEANUP.labels(execution_id=label).inc()
    oldest = max((float(row["ageSeconds"]) for row in blockers), default=0.0)
    BLOCKED_CLEANUP_OLDEST_AGE.labels(execution_id=label).set(oldest)


def _set_state(state: str, count: int, oldest, now: datetime) -> None:
    LIFECYCLE_BACKLOG.labels(state=state).set(count)
    age = 0.0 if oldest is None else max(0.0, (_aware(now) - _aware(oldest)).total_seconds())
    LIFECYCLE_OLDEST_AGE.labels(state=state).set(age)


def _aware(value: datetime) -> datetime:
    return value.astimezone(UTC) if value.tzinfo else value.replace(tzinfo=UTC)
