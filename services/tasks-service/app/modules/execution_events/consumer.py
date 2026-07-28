"""Unified execution event consumer.

Handles task.execution_started, task.execution_progressed,
task.execution_completed, task.execution_failed from parsevk.vk.events.
"""

import asyncio
import json
import logging
from contextlib import suppress
from typing import Optional

from aiokafka import AIOKafkaConsumer, ConsumerRecord
from common.events.task_execution_completed import TaskExecutionCompletedPayload
from common.events.task_execution_failed import TaskExecutionFailedPayload
from common.events.task_execution_progressed import TaskExecutionProgressedPayload
from common.events.task_execution_started import TaskExecutionStartedPayload
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import ProcessedEvent
from app.modules.execution_events.metrics import count_event
from app.modules.execution_events.service import ExecutionEventService

logger = logging.getLogger(__name__)

EXECUTION_EVENT_TYPES = {
    "task.execution_started",
    "task.execution_progressed",
    "task.execution_completed",
    "task.execution_failed",
}


class _MalformedPayload(Exception):
    """Raised when an event payload cannot be parsed."""


def _parse_payload(event_type: str, raw: str) -> Optional[object]:
    try:
        data = json.loads(raw)
        if event_type == "task.execution_started":
            return TaskExecutionStartedPayload(**data)
        if event_type == "task.execution_progressed":
            return TaskExecutionProgressedPayload(**data)
        if event_type == "task.execution_completed":
            return TaskExecutionCompletedPayload(**data)
        if event_type == "task.execution_failed":
            return TaskExecutionFailedPayload(**data)
        return None
    except Exception as exc:
        logger.warning("Failed to parse %s payload: %s", event_type, exc)
        return None


async def _is_processed(session: AsyncSession, event_id: str, consumer_name: str) -> bool:
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


async def handle_execution_event(
    session: AsyncSession,
    msg: ConsumerRecord,
    consumer_name: str,
) -> bool:
    """Process a single execution event.

    Returns True to commit offset, False to retry (sequence gap / transient error).
    """
    try:
        event_data = json.loads(msg.value)
    except json.JSONDecodeError:
        logger.warning("Invalid JSON from topic=%s", msg.topic)
        return True

    event_type = event_data.get("event_type")
    if event_type not in EXECUTION_EVENT_TYPES:
        return True  # Not our event, commit and skip.

    envelope_event_id = event_data.get("event_id")
    if not envelope_event_id:
        envelope_event_id = f"{msg.topic}:{msg.partition}:{msg.offset}"

    # Deduplicate by envelope event_id
    if await _is_processed(session, envelope_event_id, consumer_name):
        logger.debug("Duplicate event %s, skipping", envelope_event_id)
        return True

    payload_raw = event_data.get("payload")
    if not payload_raw:
        logger.warning("Empty payload for %s", event_type)
        await _mark_processed(session, envelope_event_id, consumer_name, msg.topic, msg.partition, msg.offset)
        await session.commit()
        return True

    try:
        payload = _parse_payload(event_type, payload_raw)
    except _MalformedPayload:
        logger.warning("Malformed %s payload, sending to DLQ (TODO)", event_type)
        await session.commit()
        return True

    if payload is None:
        logger.warning("Unsupported event type %s, skipping", event_type)
        await session.commit()
        return True

    service = ExecutionEventService(session)

    try:
        if event_type == "task.execution_started":
            ok = await service.apply_started(
                task_id=payload.taskId,
                run_id=payload.runId,
                execution_sequence=payload.executionSequence,
                owner_user_id=payload.ownerUserId,
            )
        elif event_type == "task.execution_progressed":
            ok = await service.apply_progressed(
                task_id=payload.taskId,
                run_id=payload.runId,
                execution_sequence=payload.executionSequence,
                processed_items=payload.processedItems,
                total_items=payload.totalItems,
                progress=payload.progress,
                stats=getattr(payload, "stats", None),
                owner_user_id=payload.ownerUserId,
            )
        elif event_type == "task.execution_completed":
            ok = await service.apply_completed(
                task_id=payload.taskId,
                run_id=payload.runId,
                execution_sequence=payload.executionSequence,
                processed_items=payload.processedItems,
                total_items=payload.totalItems,
                stats=getattr(payload, "stats", None),
                owner_user_id=payload.ownerUserId,
            )
        elif event_type == "task.execution_failed":
            ok = await service.apply_failed(
                task_id=payload.taskId,
                run_id=payload.runId,
                execution_sequence=payload.executionSequence,
                processed_items=payload.processedItems,
                total_items=payload.totalItems,
                stats=getattr(payload, "stats", None),
                error=payload.error,
                failure_kind=payload.failureKind,
                owner_user_id=payload.ownerUserId,
            )
        else:
            return True

        if not ok:
            await session.rollback()
            return False  # Don't commit offset (sequence gap).

        count_event(event_type)
        await _mark_processed(session, envelope_event_id, consumer_name, msg.topic, msg.partition, msg.offset)
        await session.commit()
        return True

    except Exception:
        logger.exception("Error processing %s for task", event_type)
        await session.rollback()
        return False


async def consume_execution_events(
    bootstrap_servers: str,
    group_id: str,
    topic: str,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    """Main consumer loop for execution events."""
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
    logger.info("Execution consumer started: group=%s, topic=%s", group_id, topic)

    consumer_name = f"{group_id}:{topic}"

    try:
        async for msg in consumer:
            if msg.value is None:
                await consumer.commit()
                continue

            async with session_factory() as session:
                ok = await handle_execution_event(session, msg, consumer_name)
                if ok:
                    await consumer.commit()
    except asyncio.CancelledError:
        logger.info("Execution consumer cancelled")
        raise
    finally:
        await consumer.stop()
