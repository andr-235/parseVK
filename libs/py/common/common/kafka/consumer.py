import asyncio
import logging
from abc import ABC, abstractmethod
from contextlib import suppress
from datetime import UTC, datetime, timedelta

from common.events import decode_payload
from common.kafka.producer import send_to_dlq
from common.kafka.repository import ProcessedEventRepository

logger = logging.getLogger(__name__)


class BaseEventConsumer(ABC):
    consumer_group: str
    consumer_name: str
    dlq_topic: str
    max_consumer_retries: int = 3

    def __init__(self, session_factory, kafka_topic, bootstrap_servers, model_class, lag_gauge=None):
        self.session_factory = session_factory
        self.kafka_topic = kafka_topic
        self.bootstrap_servers = bootstrap_servers
        self._consumer = None
        self._repo = ProcessedEventRepository(model_class, self.consumer_name)
        self._lag_gauge = lag_gauge
        self._pending_resume_tasks: set[asyncio.Task] = set()

    def _build_dlq_headers(
        self,
        event_id: str | None = None,
        event_type: str = "",
        retry_count: int = 0,
        failure_reason: str = "",
        raw_value: bytes | None = None,
    ) -> list[tuple[str, bytes]]:
        """Build metadata headers for DLQ messages."""
        headers: list[tuple[str, bytes]] = [
            ("consumer_name", self.consumer_name.encode()),
            ("original_topic", self.kafka_topic.encode()),
            ("failed_at", datetime.now(UTC).isoformat().encode()),
        ]
        if event_id:
            headers.append(("event_id", str(event_id).encode()))
        if event_type:
            headers.append(("event_type", event_type.encode()))
        if retry_count:
            headers.append(("retry_count", str(retry_count).encode()))
        if failure_reason:
            headers.append(("failure_reason", failure_reason.encode()[:2000]))
        return headers

    async def run_forever(self) -> None:
        from aiokafka import AIOKafkaConsumer

        logger.info(
            "Kafka consumer starting, topic=%s, group=%s",
            self.kafka_topic,
            self.consumer_group,
        )
        self._consumer = AIOKafkaConsumer(
            self.kafka_topic,
            bootstrap_servers=self.bootstrap_servers,
            group_id=self.consumer_group,
            enable_auto_commit=False,
        )
        await self._consumer.start()
        logger.info("Kafka consumer started, waiting for messages")
        try:
            async for message in self._consumer:
                try:
                    if await self._skip_due_to_retry_backoff(message.value):
                        continue
                    await self.handle_message(message.value)
                    await self._consumer.commit()
                except Exception:
                    await self._handle_processing_failure(message)
                self._update_lag_metric(message)
        except asyncio.CancelledError:
            pass
        finally:
            for task in self._pending_resume_tasks:
                task.cancel()
            await self.stop()

    async def _skip_due_to_retry_backoff(self, raw_value: bytes) -> bool:
        """Check if event should be skipped due to retry backoff.

        Checks:
        1. next_retry_at (durable backoff) — skip without DLQ if retry time is in the future
        2. retry_count — send to DLQ if max retries exceeded

        Returns True if event should be skipped, False to process.
        """
        payload = decode_payload(raw_value)
        if payload is None:
            return False
        event_id = payload.get("event_id")
        event_type = payload.get("event_type", "")
        if not event_id:
            return False
        async with self.session_factory() as session:
            row = await self._repo.get_event(session, event_id)
            if row is None:
                return False

            # Durable backoff — check next_retry_at before retry_count
            if row.next_retry_at is not None and datetime.now(UTC) < row.next_retry_at:
                logger.debug(
                    "Skipping event %s (type=%s): next_retry_at=%s is in the future",
                    event_id, event_type, row.next_retry_at,
                )
                return True  # Don't process, don't DLQ — partition remains paused

            # DLQ after max retries
            if row.retry_count >= self.max_consumer_retries:
                logger.warning(
                    "Event %s (type=%s) exceeded max retries (%d), sending to DLQ",
                    event_id, event_type, self.max_consumer_retries,
                )
                headers = self._build_dlq_headers(
                    event_id=str(row.event_id),
                    event_type=row.event_type,
                    retry_count=row.retry_count,
                    failure_reason=str(row.last_error or ""),
                )
                await send_to_dlq(raw_value, self.dlq_topic, self.bootstrap_servers, headers=headers)
                await self._consumer.commit()
                return True
        return False

    async def _handle_processing_failure(self, message) -> None:
        """Handle a processing failure for a Kafka message.

        Stores retry state in the database with exponential backoff.
        After max retries, sends the message to DLQ with metadata headers.
        Pauses the partition during backoff period.
        """
        from aiokafka import TopicPartition

        payload = decode_payload(message.value)
        event_id = payload.get("event_id") if payload else None
        event_type = payload.get("event_type", "") if payload else ""
        if event_id:
            async with self.session_factory() as session:
                async with session.begin():
                    current = await self._repo.get_retry_count(session, event_id)
                    current_retries = (current or 0) + 1
                    now = datetime.now(UTC)
                    backoff_seconds = min(2 ** current_retries, 60)
                    next_retry = now + timedelta(seconds=backoff_seconds)
                    error = message.value.decode("utf-8", errors="replace")[:2000]
                    await self._repo.upsert_retry(session, event_id, event_type, error, next_retry, now)
                updated = await self._repo.get_retry_count(session, event_id)
                if updated and updated >= self.max_consumer_retries:
                    logger.exception(
                        "Failed to process event %s after %d retries, sending to DLQ",
                        event_id, updated,
                    )
                    headers = self._build_dlq_headers(
                        event_id=event_id,
                        event_type=event_type,
                        retry_count=updated,
                        failure_reason=error,
                    )
                    await send_to_dlq(message.value, self.dlq_topic, self.bootstrap_servers, headers=headers)
                    await self._consumer.commit()
                else:
                    logger.exception(
                        "Failed to process event %s (retry %d/%d, next at %s)",
                        event_id, updated or 1, self.max_consumer_retries, next_retry,
                    )
                    tp = TopicPartition(message.topic, message.partition)
                    self._consumer.pause(tp)
                    resume_delay = (next_retry - datetime.now(UTC)).total_seconds()
                    task = asyncio.create_task(
                        self._delayed_resume(tp, max(resume_delay, 0))
                    )
                    self._pending_resume_tasks.add(task)
                    task.add_done_callback(self._pending_resume_tasks.discard)
        else:
            logger.warning(
                "Poison pill detected at offset %s (no event_id), sending to DLQ and committing offset",
                message.offset,
            )
            headers = self._build_dlq_headers(
                failure_reason=f"Poison pill at offset {message.offset}: no event_id",
            )
            await send_to_dlq(message.value, self.dlq_topic, self.bootstrap_servers, headers=headers)
            await self._consumer.commit()

    async def _delayed_resume(self, tp, delay: float) -> None:
        await asyncio.sleep(delay)
        try:
            self._consumer.resume(tp)
            logger.info("Resumed partition %s after retry backoff", tp)
        except Exception:
            logger.exception("Failed to resume partition %s", tp)

    def _update_lag_metric(self, message) -> None:
        if self._lag_gauge is None:
            return
        try:
            lag = message.highwater_mark - message.offset - 1 if message.highwater_mark is not None else 0
            self._lag_gauge.labels(
                topic=message.topic,
                consumer_group=self.consumer_group,
                partition=str(message.partition),
            ).set(max(lag, 0))
        except Exception:
            pass

    async def stop(self) -> None:
        if self._consumer is not None:
            with suppress(Exception):
                await self._consumer.stop()
            self._consumer = None

    @abstractmethod
    async def handle_message(self, raw_value: bytes) -> None:
        ...
