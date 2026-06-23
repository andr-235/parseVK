import logging

logger = logging.getLogger(__name__)


async def send_to_dlq(raw_value: bytes, dlq_topic: str, bootstrap_servers: str) -> None:
    from aiokafka import AIOKafkaProducer

    producer = AIOKafkaProducer(bootstrap_servers=bootstrap_servers)
    await producer.start()
    try:
        await producer.send_and_wait(dlq_topic, value=raw_value)
        logger.info("Sent failed message to DLQ topic=%s", dlq_topic)
    except Exception:
        logger.exception("Failed to send message to DLQ topic=%s", dlq_topic)
    finally:
        await producer.stop()
