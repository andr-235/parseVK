"""Lag metric updates for AIOKafka consumers."""

import logging

logger = logging.getLogger(__name__)


def update_lag_metric(
    lag_gauge,
    consumer_group: str,
    consumer,
    message,
) -> None:
    if lag_gauge is None:
        return
    try:
        from aiokafka import TopicPartition

        partition = TopicPartition(message.topic, message.partition)
        highwater = consumer.highwater(partition)
        if highwater is None:
            logger.debug(
                "Kafka highwater is unavailable for %s[%s]",
                message.topic,
                message.partition,
            )
            return
        lag_gauge.labels(
            topic=message.topic,
            consumer_group=consumer_group,
            partition=str(message.partition),
        ).set(max(highwater - message.offset - 1, 0))
    except Exception:
        logger.warning(
            "Failed to update Kafka lag for group=%s topic=%s partition=%s",
            consumer_group,
            getattr(message, "topic", "unknown"),
            getattr(message, "partition", "unknown"),
            exc_info=True,
        )
