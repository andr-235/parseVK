import json
import logging
from contextlib import suppress

from prometheus_client import Gauge
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.clients.tasks.client import TasksClient
from app.core.config import settings
from app.db.session import SessionLocal
from app.modules.ingestion.repository import IngestionRepository
from app.modules.ingestion.service import IngestionService
from app.modules.outbox.repository import OutboxRepository
from app.modules.outbox.service import OutboxService
from app.modules.tasks.events import TaskEvent
from app.modules.tasks.service import TaskEventsHandler, TaskEventsRepository

logger = logging.getLogger(__name__)

DLQ_TOPIC = "parsevk.tasks.dlq"
MAX_CONSUMER_RETRIES = 3

_consumer_lag = Gauge(
    "kafka_consumer_lag",
    "Consumer lag per partition",
    ["topic", "consumer_group", "partition"],
)


class TaskEventsConsumer:
    def __init__(self, *, session_factory: async_sessionmaker | None = None, tasks_client: TasksClient | None = None):
        self.session_factory = session_factory or SessionLocal
        self.tasks_client = tasks_client or TasksClient()
        self._consumer = None
        self._retry_count: dict[str, int] = {}

    async def run_forever(self) -> None:
        from aiokafka import AIOKafkaConsumer

        self._consumer = AIOKafkaConsumer(
            settings.kafka_topic_tasks,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id="im-service",
            enable_auto_commit=False,
        )
        await self._consumer.start()
        try:
            async for message in self._consumer:
                message_key = f"{message.partition}:{message.offset}"
                try:
                    await self.handle_message(message.value)
                    await self._consumer.commit()
                    self._retry_count.pop(message_key, None)
                except Exception:
                    retries = self._retry_count.get(message_key, 0) + 1
                    self._retry_count[message_key] = retries
                    if retries >= MAX_CONSUMER_RETRIES:
                        logger.exception(
                            "Error processing message at offset %s after %d retries, sending to DLQ",
                            message.offset, retries,
                        )
                        await self._send_to_dlq(message.value)
                        self._retry_count.pop(message_key, None)
                        await self._consumer.commit()
                    else:
                        logger.exception(
                            "Error processing message at offset %s (retry %d/%d)",
                            message.offset, retries, MAX_CONSUMER_RETRIES,
                        )
                self._update_lag_metric(message)
        finally:
            await self.stop()

    def _update_lag_metric(self, message) -> None:
        try:
            lag = message.highwater_mark - message.offset - 1 if message.highwater_mark is not None else 0
            _consumer_lag.labels(
                topic=message.topic,
                consumer_group="im-service",
                partition=str(message.partition),
            ).set(max(lag, 0))
        except Exception:
            pass

    async def handle_message(self, raw_value: bytes | str | dict) -> None:
        if isinstance(raw_value, bytes):
            raw_value = raw_value.decode("utf-8")
        payload = json.loads(raw_value) if isinstance(raw_value, str) else raw_value
        event = TaskEvent.model_validate(payload)
        if event.event_version != 1:
            logger.warning("Skipping unsupported event version %d for type %s", event.event_version, event.event_type)
            return

        messenger = event.messenger()
        if messenger not in ("whatsapp", "max"):
            logger.debug("Skipping event for messenger=%s", messenger)
            return

        async with self.session_factory() as session:
            async with session.begin():
                repository = TaskEventsRepository(session)
                handler = TaskEventsHandler(repository, self.tasks_client)
                task_run = await handler.handle(event)

                if task_run is not None and event.event_type in {"task.created", "task.resumed"}:
                    ingestion = IngestionService(
                        repository=IngestionRepository(session),
                        tasks_client=self.tasks_client,
                        outbox_service=OutboxService(OutboxRepository(session)),
                    )
                    await ingestion.execute(task_run, correlation_id=event.correlation_id)

    async def _send_to_dlq(self, raw_value: bytes) -> None:
        from aiokafka import AIOKafkaProducer

        producer = AIOKafkaProducer(bootstrap_servers=settings.kafka_bootstrap_servers)
        await producer.start()
        try:
            await producer.send_and_wait(DLQ_TOPIC, value=raw_value)
            logger.info("Sent failed message to DLQ topic=%s", DLQ_TOPIC)
        except Exception:
            logger.exception("Failed to send message to DLQ topic=%s", DLQ_TOPIC)
        finally:
            await producer.stop()

    async def stop(self) -> None:
        if self._consumer is not None:
            with suppress(Exception):
                await self._consumer.stop()
            self._consumer = None
