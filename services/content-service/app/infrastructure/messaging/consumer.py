import asyncio
import json
import logging
from contextlib import suppress

logger = logging.getLogger(__name__)


class KafkaProjectionConsumer:
    def __init__(
        self,
        *,
        topic: str,
        group_id: str,
        event_model,
        handler_factory,
        session_factory,
        max_attempts: int,
        backoff_seconds: float,
        poison_policy: str = "pause",
        bootstrap_servers: str = "kafka:9092",
    ):
        self.topic = topic
        self.group_id = group_id
        self.event_model = event_model
        self.handler_factory = handler_factory
        self.session_factory = session_factory
        self.max_attempts = max(max_attempts, 1)
        self.backoff_seconds = max(backoff_seconds, 0)
        self.poison_policy = poison_policy
        self.bootstrap_servers = bootstrap_servers
        self._consumer = None
        self.healthy = True

    async def run_forever(self) -> None:
        from aiokafka import AIOKafkaConsumer

        self._consumer = AIOKafkaConsumer(
            self.topic,
            bootstrap_servers=self.bootstrap_servers,
            group_id=self.group_id,
            enable_auto_commit=False,
        )
        await self._consumer.start()
        logger.info(
            "Kafka projection consumer started: topic=%s group=%s",
            self.topic,
            self.group_id,
        )
        try:
            async for message in self._consumer:
                if not await self.process_message(message):
                    return
        finally:
            await self.stop()

    async def process_message(self, message) -> bool:
        payload = self._decode(message.value)
        event = self.event_model.model_validate(payload)
        for attempt in range(1, self.max_attempts + 1):
            try:
                async with self.session_factory() as session:
                    async with session.begin():
                        await self.handler_factory(session).handle(event)
                await self._consumer.commit()
                return True
            except Exception:
                logger.exception(
                    "Kafka event processing failed: topic=%s partition=%s "
                    "offset=%s event_id=%s event_type=%s attempt=%s/%s",
                    self.topic,
                    message.partition,
                    message.offset,
                    getattr(event, "event_id", None),
                    getattr(event, "event_type", None),
                    attempt,
                    self.max_attempts,
                )
                if attempt < self.max_attempts:
                    await asyncio.sleep(self.backoff_seconds)
        self.healthy = False
        if self.poison_policy == "stop":
            raise RuntimeError(f"Poison event stopped consumer {self.group_id}")
        assignment = self._consumer.assignment()
        if assignment:
            self._consumer.pause(*assignment)
        logger.error(
            "Kafka consumer paused after poison event: topic=%s group=%s offset=%s",
            self.topic,
            self.group_id,
            message.offset,
        )
        return False

    async def stop(self) -> None:
        if self._consumer is not None:
            with suppress(Exception):
                await self._consumer.stop()
            self._consumer = None

    @staticmethod
    def _decode(value):
        if isinstance(value, bytes):
            value = value.decode("utf-8")
        return json.loads(value) if isinstance(value, str) else value
