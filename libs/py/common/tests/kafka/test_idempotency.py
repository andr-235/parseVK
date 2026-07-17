"""Integration tests for EDA hardening — idempotency, producer caching, and durable backoff."""

import json
from unittest.mock import AsyncMock, patch

import pytest

from common.kafka.producer import send_to_dlq, _dlq_producers


@pytest.mark.anyio
async def test_send_to_dlq_caches_producer_by_bootstrap_servers():
    """DLQ producer should be reused when same bootstrap_servers is used."""
    # Clear cache before test
    _dlq_producers.clear()

    raw_value = json.dumps({"event_id": "test"}).encode()

    with patch("common.kafka.producer.AIOKafkaProducer") as mock_producer_cls:
        mock_instance = AsyncMock()
        mock_producer_cls.return_value = mock_instance

        # First call creates a producer
        await send_to_dlq(raw_value, "dlq-topic", "kafka:9092")
        assert mock_producer_cls.call_count == 1
        mock_instance.start.assert_awaited_once()

        # Second call with same bootstrap_servers reuses the cached producer
        await send_to_dlq(raw_value, "dlq-topic", "kafka:9092")
        assert mock_producer_cls.call_count == 1  # No new producer created
        assert mock_instance.send_and_wait.await_count == 2  # Both calls went through

    # Clean up
    _dlq_producers.clear()


@pytest.mark.anyio
async def test_send_to_dlq_creates_separate_producers_for_different_bootstrap():
    """Different bootstrap_servers should create different cached producers."""
    _dlq_producers.clear()

    raw_value = json.dumps({"event_id": "test"}).encode()

    with patch("common.kafka.producer.AIOKafkaProducer") as mock_producer_cls:
        mock_instance1 = AsyncMock()
        mock_instance2 = AsyncMock()
        mock_producer_cls.side_effect = [mock_instance1, mock_instance2]

        await send_to_dlq(raw_value, "dlq-topic", "kafka:9092")
        await send_to_dlq(raw_value, "dlq-topic", "kafka:9093")

        assert mock_producer_cls.call_count == 2  # Two different producers

    _dlq_producers.clear()


@pytest.mark.anyio
async def test_send_to_dlq_passes_headers():
    """DLQ message should include metadata headers when provided."""
    _dlq_producers.clear()

    raw_value = json.dumps({"event_id": "evt-1", "event_type": "test"}).encode()
    headers = [
        ("consumer_name", b"test-consumer"),
        ("event_id", b"evt-1"),
        ("event_type", b"test"),
    ]

    with patch("common.kafka.producer.AIOKafkaProducer") as mock_producer_cls:
        mock_instance = AsyncMock()
        mock_producer_cls.return_value = mock_instance

        await send_to_dlq(raw_value, "dlq-topic", "kafka:9092", headers=headers)

        mock_instance.send_and_wait.assert_awaited_once_with(
            topic="dlq-topic",
            value=raw_value,
            headers=headers,
        )

    _dlq_producers.clear()


@pytest.mark.anyio
async def test_send_to_dlq_no_headers_omits_header_param():
    """When headers are None, send_and_wait should not include headers kwarg."""
    _dlq_producers.clear()

    raw_value = json.dumps({"event_id": "test"}).encode()

    with patch("common.kafka.producer.AIOKafkaProducer") as mock_producer_cls:
        mock_instance = AsyncMock()
        mock_producer_cls.return_value = mock_instance

        await send_to_dlq(raw_value, "dlq-topic", "kafka:9092")

        # Without headers, send_and_wait should be called without headers kwarg
        call_kwargs = mock_instance.send_and_wait.call_args[1]
        assert "headers" not in call_kwargs

    _dlq_producers.clear()
