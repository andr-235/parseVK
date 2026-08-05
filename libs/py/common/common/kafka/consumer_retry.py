"""Durable retry and dead-letter handling for Kafka consumers."""

import asyncio
import logging
from datetime import UTC, datetime, timedelta

from common.events import decode_payload
from common.kafka.consumer_dlq import build_dlq_headers
from common.kafka.message_identity import message_identity
from common.kafka.producer import send_to_dlq

logger = logging.getLogger(__name__)


class ConsumerRetryController:
    def __init__(
        self,
        *,
        session_factory,
        repository,
        consumer_name: str,
        kafka_topic: str,
        dlq_topic: str,
        bootstrap_servers: str,
        max_retries: int,
    ) -> None:
        self.session_factory = session_factory
        self.repository = repository
        self.consumer_name = consumer_name
        self.kafka_topic = kafka_topic
        self.dlq_topic = dlq_topic
        self.bootstrap_servers = bootstrap_servers
        self.max_retries = max_retries
        self.pending_resume_tasks: set[asyncio.Task] = set()

    async def skip_due_to_backoff(self, raw_value: bytes, consumer) -> bool:
        payload = decode_payload(raw_value)
        event_id, event_type = message_identity(payload)
        if not event_id:
            return False
        async with self.session_factory() as session:
            row = await self.repository.get_event(session, event_id)
            if row is None:
                return False
            if row.next_retry_at and datetime.now(UTC) < row.next_retry_at:
                logger.debug(
                    "Skipping event %s (type=%s): next_retry_at=%s",
                    event_id,
                    event_type,
                    row.next_retry_at,
                )
                return True
            if row.retry_count < self.max_retries:
                return False
            logger.warning(
                "Event %s (type=%s) exceeded max retries (%d)",
                event_id,
                event_type,
                self.max_retries,
            )
            await self._send_to_dlq(
                raw_value,
                event_id=str(row.event_id),
                event_type=row.event_type,
                retry_count=row.retry_count,
                failure_reason=str(row.last_error or ""),
            )
            await consumer.commit()
            return True

    async def handle_failure(self, message, error: Exception, consumer) -> None:
        from aiokafka import TopicPartition

        payload = decode_payload(message.value)
        event_id, event_type = message_identity(payload)
        if not event_id:
            await self._handle_poison_pill(message, error, consumer)
            return

        failure_reason = self._failure_reason(error)
        async with self.session_factory() as session:
            async with session.begin():
                current = await self.repository.get_retry_count(session, event_id)
                retry_count = (current or 0) + 1
                now = datetime.now(UTC)
                next_retry = now + timedelta(
                    seconds=min(2**retry_count, 60)
                )
                await self.repository.upsert_retry(
                    session,
                    event_id,
                    event_type,
                    failure_reason,
                    next_retry,
                    now,
                )
            updated = await self.repository.get_retry_count(session, event_id)

        if updated and updated >= self.max_retries:
            logger.error(
                "Failed event %s after %d retries; sending to DLQ",
                event_id,
                updated,
                exc_info=(type(error), error, error.__traceback__),
            )
            await self._send_to_dlq(
                message.value,
                event_id=event_id,
                event_type=event_type,
                retry_count=updated,
                failure_reason=failure_reason,
            )
            await consumer.commit()
            return

        logger.error(
            "Failed event %s (retry %d/%d, next at %s)",
            event_id,
            updated or 1,
            self.max_retries,
            next_retry,
            exc_info=(type(error), error, error.__traceback__),
        )
        partition = TopicPartition(message.topic, message.partition)
        consumer.pause(partition)
        delay = max((next_retry - datetime.now(UTC)).total_seconds(), 0)
        task = asyncio.create_task(self._delayed_resume(consumer, partition, delay))
        self.pending_resume_tasks.add(task)
        task.add_done_callback(self.pending_resume_tasks.discard)

    async def cancel_pending_resumes(self) -> None:
        for task in self.pending_resume_tasks:
            task.cancel()
        if self.pending_resume_tasks:
            await asyncio.gather(*self.pending_resume_tasks, return_exceptions=True)
        self.pending_resume_tasks.clear()

    async def _handle_poison_pill(self, message, error, consumer) -> None:
        reason = f"Poison pill at offset {message.offset}: {self._failure_reason(error)}"
        logger.warning(reason)
        await self._send_to_dlq(message.value, failure_reason=reason)
        await consumer.commit()

    async def _send_to_dlq(self, raw_value: bytes, **metadata) -> None:
        headers = build_dlq_headers(
            consumer_name=self.consumer_name,
            original_topic=self.kafka_topic,
            **metadata,
        )
        await send_to_dlq(
            raw_value,
            self.dlq_topic,
            self.bootstrap_servers,
            headers=headers,
        )

    async def _delayed_resume(self, consumer, partition, delay: float) -> None:
        await asyncio.sleep(delay)
        try:
            consumer.resume(partition)
            logger.info("Resumed partition %s after retry backoff", partition)
        except Exception:
            logger.exception("Failed to resume partition %s", partition)

    @staticmethod
    def _failure_reason(error: Exception) -> str:
        return f"{type(error).__name__}: {error}"[:2000]
