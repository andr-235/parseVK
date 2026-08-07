"""Base lifecycle for durable Kafka event consumers."""

import asyncio
import logging
from abc import ABC, abstractmethod
from contextlib import suppress

from common.kafka.consumer_metrics import update_lag_metric
from common.kafka.consumer_retry import ConsumerRetryController
from common.kafka.repository import ProcessedEventRepository

logger = logging.getLogger(__name__)


class BaseEventConsumer(ABC):
    consumer_group: str
    consumer_name: str
    dlq_topic: str
    max_consumer_retries: int = 3
    auto_offset_reset: str = "latest"

    def __init__(
        self,
        session_factory,
        kafka_topic,
        bootstrap_servers,
        model_class,
        lag_gauge=None,
        fetch_max_bytes: int | None = None,
        max_partition_fetch_bytes: int | None = None,
    ):
        self.session_factory = session_factory
        self.kafka_topic = kafka_topic
        self.bootstrap_servers = bootstrap_servers
        self._consumer = None
        self._fetch_max_bytes = fetch_max_bytes
        self._max_partition_fetch_bytes = max_partition_fetch_bytes
        repository = ProcessedEventRepository(model_class, self.consumer_name)
        self._retry = ConsumerRetryController(
            session_factory=session_factory,
            repository=repository,
            consumer_name=self.consumer_name,
            kafka_topic=kafka_topic,
            dlq_topic=self.dlq_topic,
            bootstrap_servers=bootstrap_servers,
            max_retries=self.max_consumer_retries,
        )
        self._lag_gauge = lag_gauge

    async def run_forever(self) -> None:
        from aiokafka import AIOKafkaConsumer

        logger.info(
            "Kafka consumer starting, topic=%s, group=%s",
            self.kafka_topic,
            self.consumer_group,
        )
        consumer_options = {
            "bootstrap_servers": self.bootstrap_servers,
            "group_id": self.consumer_group,
            "enable_auto_commit": False,
            "auto_offset_reset": self.auto_offset_reset,
        }
        if self._fetch_max_bytes is not None:
            consumer_options["fetch_max_bytes"] = self._fetch_max_bytes
        if self._max_partition_fetch_bytes is not None:
            consumer_options["max_partition_fetch_bytes"] = (
                self._max_partition_fetch_bytes
            )
        self._consumer = AIOKafkaConsumer(
            self.kafka_topic,
            **consumer_options,
        )
        await self._consumer.start()
        logger.info("Kafka consumer started, waiting for messages")
        try:
            async for message in self._consumer:
                try:
                    if await self._retry.skip_due_to_backoff(
                        message.value,
                        self._consumer,
                    ):
                        continue
                    await self.handle_message(message.value)
                    await self._consumer.commit()
                except Exception as error:
                    await self._retry.handle_failure(
                        message,
                        error,
                        self._consumer,
                    )
                update_lag_metric(
                    self._lag_gauge,
                    self.consumer_group,
                    self._consumer,
                    message,
                )
        except asyncio.CancelledError:
            pass
        finally:
            await self._retry.cancel_pending_resumes()
            await self.stop()

    async def stop(self) -> None:
        if self._consumer is not None:
            with suppress(Exception):
                await self._consumer.stop()
            self._consumer = None

    @abstractmethod
    async def handle_message(self, raw_value: bytes) -> None:
        ...
