"""Kafka consumer for task.execution_progressed events from parsevk.vk.events.

Idempotency:
- Deduplicate by event_id via processed_events table
- Skip if executionSequence <= last_execution_sequence
- Skip if runId != execution_run_id
- Skip if task status is in {done, failed, cancelled}
"""

import asyncio
import json
import logging
from datetime import UTC, datetime
from typing import Any, Optional

from aiokafka import AIOKafkaConsumer, ConsumerRecord
from common.events.task_execution_progressed import TaskExecutionProgressedPayload
from common.runtime import WorkerHealth
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from uuid import uuid4

from app.db.models import OutboxEvent, ProcessedEvent, Task

logger = logging.getLogger(__name__)

# Terminal statuses for which progress is ignored
TERMINAL_STATUSES = {"done", "failed", "cancelled"}

CONSUMER_GROUP = "tasks-service-vk-execution-v1"
TOPIC = "parsevk.vk.events"


def _parse_payload(raw: Any) -> Optional[TaskExecutionProgressedPayload]:
    """Parse a task.execution_progressed payload from JSON string or dict."""
    try:
        if isinstance(raw, str):
            data = json.loads(raw)
        elif isinstance(raw, bytes):
            data = json.loads(raw.decode("utf-8"))
        elif isinstance(raw, dict):
            data = raw
        else:
            logger.warning("Unexpected payload type: %s", type(raw))
            return None
        return TaskExecutionProgressedPayload(**data)
    except Exception as exc:
        logger.warning("Failed to parse task.execution_progressed payload: %s", exc)
        return None


async def _is_processed(
    session: AsyncSession, event_id: str, consumer_name: str
) -> bool:
    result = await session.execute(
        select(ProcessedEvent).where(
            ProcessedEvent.event_id == event_id,
            ProcessedEvent.consumer_name == consumer_name,
        )
    )
    return result.scalar_one_or_none() is not None


async def _mark_processed(
    session: AsyncSession,
    event_id: str,
    consumer_name: str,
    topic: str,
    partition: int,
    offset_: int,
) -> None:
    session.add(
        ProcessedEvent(
            event_id=event_id,
            consumer_name=consumer_name,
            topic=topic,
            partition=partition,
            offset=offset_,
        )
    )


async def _has_terminal_status(session: AsyncSession, task_id: int) -> bool:
    result = await session.execute(select(Task.status).where(Task.id == task_id))
    row = result.scalar_one_or_none()
    if row is None:
        return True  # No task — treat as terminal (ignore)
    return row in TERMINAL_STATUSES


async def handle_execution_progressed(
    session: AsyncSession,
    msg: ConsumerRecord,
    payload: TaskExecutionProgressedPayload,
    consumer_name: str,
) -> bool:
    """Process a single task.execution_progressed event.

    Returns True if offset should be committed, False on transient error.
    """
    event_id = f"{msg.topic}:{msg.partition}:{msg.offset}"

    # 1. Deduplicate by event_id
    if await _is_processed(session, event_id, consumer_name):
        logger.debug("Duplicate event %s, skipping", event_id)
        return True

    task_id = payload.taskId

    # 2. Check terminal status before locking
    if await _has_terminal_status(session, task_id):
        logger.debug("Task %d in terminal status, marking processed", task_id)
        await _mark_processed(
            session, event_id, consumer_name, msg.topic, msg.partition, msg.offset
        )
        await session.commit()
        return True

    # 3. SELECT FOR UPDATE the task
    result = await session.execute(
        text(
            """
            SELECT id, status, execution_run_id, last_execution_sequence, revision
            FROM tasks
            WHERE id = :task_id
            FOR UPDATE
            """
        ),
        {"task_id": task_id},
    )
    row = result.one_or_none()
    if row is None:
        logger.warning("Task %d not found, marking processed", task_id)
        await _mark_processed(
            session, event_id, consumer_name, msg.topic, msg.partition, msg.offset
        )
        await session.commit()
        return True

    task_status = row[1]
    task_run_id = row[2]
    last_seq = row[3] or 0
    current_revision = row[4] or 0

    # 4. Check run match
    if task_run_id != payload.runId:
        logger.debug(
            "runId mismatch for task %d: expected %s, got %s",
            task_id,
            task_run_id,
            payload.runId,
        )
        await _mark_processed(
            session, event_id, consumer_name, msg.topic, msg.partition, msg.offset
        )
        await session.commit()
        return True

    # 5. Check terminal status after lock (authoritative)
    if task_status in TERMINAL_STATUSES:
        logger.debug("Task %d is %s after lock, ignoring progress", task_id, task_status)
        await _mark_processed(
            session, event_id, consumer_name, msg.topic, msg.partition, msg.offset
        )
        await session.commit()
        return True

    # 6. Check sequence monotonicity
    if payload.executionSequence <= last_seq:
        logger.debug(
            "Stale sequence for task %d: %d <= %d",
            task_id,
            payload.executionSequence,
            last_seq,
        )
        await _mark_processed(
            session, event_id, consumer_name, msg.topic, msg.partition, msg.offset
        )
        await session.commit()
        return True

    # 7. Update task progress
    new_revision = current_revision + 1
    now = datetime.now(UTC)

    await session.execute(
        text(
            """
            UPDATE tasks
            SET
                processed_items = :processed_items,
                total_items = :total_items,
                progress = :progress,
                stats = :stats::jsonb,
                last_execution_sequence = :execution_sequence,
                revision = :revision,
                updated_at = :updated_at
            WHERE id = :task_id
            """
        ),
        {
            "processed_items": payload.processedItems,
            "total_items": payload.totalItems,
            "progress": payload.progress,
            "stats": json.dumps(payload.stats),
            "execution_sequence": payload.executionSequence,
            "revision": new_revision,
            "updated_at": now,
            "task_id": task_id,
        },
    )

    # 8. Emit task.state_changed via outbox
    session.add(
        OutboxEvent(
            id=uuid4(),
            event_type="task.state_changed",
            aggregate_type="task",
            aggregate_id=str(task_id),
            dedupe_key=f"task.state_changed:{task_id}:progress:{new_revision}",
            payload={
                "taskId": task_id,
                "runId": payload.runId,
                "ownerUserId": payload.ownerUserId,
                "status": task_status,
                "taskRevision": new_revision,
                "processedItems": payload.processedItems,
                "totalItems": payload.totalItems,
                "progress": payload.progress,
                "stats": payload.stats,
                "changedAt": now.isoformat(),
            },
        )
    )

    # 9. Mark as processed
    await _mark_processed(
        session, event_id, consumer_name, msg.topic, msg.partition, msg.offset
    )

    await session.commit()
    logger.info(
        "Progress updated for task %d: seq=%d, revision=%d",
        task_id,
        payload.executionSequence,
        new_revision,
    )
    return True


async def consume_progress_events(
    bootstrap_servers: str,
    group_id: str,
    topic: str,
    session_factory: async_sessionmaker[AsyncSession],
    health: WorkerHealth | None = None,
) -> None:
    """Main consumer loop for task.execution_progressed events."""
    consumer = AIOKafkaConsumer(
        topic,
        bootstrap_servers=bootstrap_servers,
        group_id=group_id,
        enable_auto_commit=False,
        auto_offset_reset="earliest",
        key_deserializer=lambda k: k.decode() if k else None,
        value_deserializer=lambda v: v.decode() if v else None,
    )

    await consumer.start()
    logger.info("Consumer started: group=%s, topic=%s", group_id, topic)

    consumer_name = f"{group_id}:{topic}"

    try:
        async for msg in consumer:
            if msg.value is None:
                await consumer.commit()
                continue

            # Parse envelope
            try:
                event_data = json.loads(msg.value)
            except json.JSONDecodeError as exc:
                logger.warning("Invalid JSON from topic=%s: %s", topic, exc)
                await consumer.commit()
                continue

            event_type = event_data.get("event_type")
            if event_type != "task.execution_progressed":
                continue

            payload_raw = event_data.get("payload")
            if not payload_raw:
                await consumer.commit()
                continue

            payload = _parse_payload(payload_raw)
            if payload is None:
                await consumer.commit()
                continue

            async with session_factory() as session:
                try:
                    ok = await handle_execution_progressed(
                        session, msg, payload, consumer_name
                    )
                    if ok:
                        await consumer.commit()
                        if health is not None:
                            health.mark_cycle_success()
                except Exception:
                    logger.exception(
                        "Error processing progress event for task %s", payload.taskId
                    )
                    if health is not None:
                        health.mark_cycle_error(
                            f"Failed to process progress event for task {payload.taskId}"
                        )
                    # Do NOT commit offset — event will be retried
    except asyncio.CancelledError:
        logger.info("Progress consumer cancelled")
        raise
    finally:
        await consumer.stop()
