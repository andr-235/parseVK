import logging
import sys
from types import SimpleNamespace
from unittest.mock import Mock

from common.kafka.consumer_metrics import update_lag_metric


class TopicPartition:
    def __init__(self, topic: str, partition: int):
        self.topic = topic
        self.partition = partition

    def __eq__(self, other):
        return (
            isinstance(other, TopicPartition)
            and self.topic == other.topic
            and self.partition == other.partition
        )


def test_lag_uses_aiokafka_consumer_highwater(monkeypatch):
    monkeypatch.setitem(
        sys.modules,
        "aiokafka",
        SimpleNamespace(TopicPartition=TopicPartition),
    )
    gauge_value = Mock()
    gauge = SimpleNamespace(labels=Mock(return_value=gauge_value))
    consumer = SimpleNamespace(highwater=Mock(return_value=12))
    message = SimpleNamespace(topic="commands", partition=2, offset=7)

    update_lag_metric(gauge, "vk-commands", consumer, message)

    consumer.highwater.assert_called_once_with(TopicPartition("commands", 2))
    gauge.labels.assert_called_once_with(
        topic="commands",
        consumer_group="vk-commands",
        partition="2",
    )
    gauge_value.set.assert_called_once_with(4)


def test_lag_failure_is_logged(monkeypatch, caplog):
    monkeypatch.setitem(
        sys.modules,
        "aiokafka",
        SimpleNamespace(TopicPartition=TopicPartition),
    )
    consumer = SimpleNamespace(highwater=Mock(side_effect=RuntimeError("offline")))
    message = SimpleNamespace(topic="commands", partition=1, offset=3)

    with caplog.at_level(logging.WARNING):
        update_lag_metric(Mock(), "vk-commands", consumer, message)

    assert "Failed to update Kafka lag" in caplog.text
    assert "offline" in caplog.text
