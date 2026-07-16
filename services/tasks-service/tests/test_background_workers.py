"""Tests for background workers lifecycle."""

import asyncio
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.background import supervise
from app.background.health import WorkerHealth


@pytest.mark.asyncio
async def test_supervise_completes_successfully():
    """supervise runs a worker that completes without error."""
    health = WorkerHealth()

    async def good_worker():
        pass

    await supervise("test-good", good_worker, health=health)
    assert health.is_healthy is True


@pytest.mark.asyncio
async def test_supervise_sets_health_flag():
    """supervise marks health healthy on successful completion."""
    health = WorkerHealth()

    async def worker():
        pass

    await supervise("test-health", worker, health=health)
    assert health.is_healthy is True


@pytest.mark.asyncio
async def test_supervise_handles_cancelled_error():
    """supervise exits cleanly on CancelledError."""
    health = WorkerHealth()
    health.mark_started()

    async def cancelling_worker():
        raise asyncio.CancelledError()

    await supervise("test-cancel", cancelling_worker, health=health)
    assert health.running is False


@pytest.mark.asyncio
async def test_supervise_without_health_flag():
    """supervise works without a health flag."""

    async def worker():
        pass

    await supervise("test-no-flag", worker)
    # Should not raise


@pytest.mark.asyncio
async def test_supervise_retries_on_exception():
    """supervise retries worker after exception with exponential backoff."""
    call_count = 0

    async def flaky_worker():
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            raise RuntimeError(f"Attempt {call_count} failed")

    with patch("app.background.supervisor.asyncio.sleep", AsyncMock()):
        await supervise("test-flaky", flaky_worker)
    assert call_count == 3, f"Expected 3 calls, got {call_count}"


@pytest.mark.asyncio
async def test_outbox_worker_creates_producer_once(monkeypatch):
    """OutboxWorker creates one producer and starts it once."""
    from app.background import outbox_worker

    class FakeSession:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        def begin(self):
            return self

    pub_mock = AsyncMock()
    pub_mock.publish_batch = AsyncMock(return_value=0)

    class FakeFactory:
        def __init__(self, session, *, producer, on_task_complete=None):
            self.session = session
            self.producer = producer

        def create_outbox_publisher(self):
            return pub_mock

    start_calls = 0
    stop_calls = 0

    class FakeProducer:
        async def start(self):
            nonlocal start_calls
            start_calls += 1

        async def stop(self):
            nonlocal stop_calls
            stop_calls += 1

    async def sleep_once(seconds):
        raise asyncio.CancelledError

    monkeypatch.setattr(outbox_worker, "SessionLocal", FakeSession)
    monkeypatch.setattr(outbox_worker, "AIOKafkaProducer", lambda **kwargs: FakeProducer())
    monkeypatch.setattr(outbox_worker, "ApplicationFactory", FakeFactory)
    monkeypatch.setattr(outbox_worker.asyncio, "sleep", sleep_once)

    with pytest.raises(asyncio.CancelledError):
        await outbox_worker.publish_outbox_forever()

    assert start_calls == 1, f"Expected 1 start call, got {start_calls}"
    assert stop_calls == 1, f"Expected 1 stop call, got {stop_calls}"
    assert pub_mock.publish_batch.await_count == 1


@pytest.mark.asyncio
async def test_outbox_worker_stops_producer_on_exit(monkeypatch):
    """Worker stops producer on normal exit via CancelledError."""
    from app.background import outbox_worker

    class FakeSession:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        def begin(self):
            return self

    pub_mock = AsyncMock()
    pub_mock.publish_batch = AsyncMock(return_value=0)

    class FakeFactory:
        def __init__(self, session, *, producer, on_task_complete=None):
            self.session = session
            self.producer = producer

        def create_outbox_publisher(self):
            return pub_mock

    start_called = False
    stop_called = False

    class FakeProducer:
        async def start(self):
            nonlocal start_called
            start_called = True

        async def stop(self):
            nonlocal stop_called
            stop_called = True

    async def sleep_once(seconds):
        raise asyncio.CancelledError

    monkeypatch.setattr(outbox_worker, "SessionLocal", FakeSession)
    monkeypatch.setattr(outbox_worker, "AIOKafkaProducer", lambda **kwargs: FakeProducer())
    monkeypatch.setattr(outbox_worker, "ApplicationFactory", FakeFactory)
    monkeypatch.setattr(outbox_worker.asyncio, "sleep", sleep_once)

    with pytest.raises(asyncio.CancelledError):
        await outbox_worker.publish_outbox_forever()

    assert start_called, "Producer should have been started"
    assert stop_called, "Producer should have been stopped"


@pytest.mark.asyncio
async def test_outbox_worker_stops_producer_on_cancelled_error(monkeypatch):
    """Producer.stop() called in finally when CancelledError occurs after start."""
    from app.background import outbox_worker

    class FakeSession:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        def begin(self):
            return self

    class FakeFactory:
        def __init__(self, session, *, producer, on_task_complete=None):
            self.session = session
            self.producer = producer

        def create_outbox_publisher(self):
            publisher = AsyncMock()
            publisher.publish_batch = AsyncMock(side_effect=asyncio.CancelledError)
            return publisher

    start_called = False
    stop_called = False

    class FakeProducer:
        async def start(self):
            nonlocal start_called
            start_called = True

        async def stop(self):
            nonlocal stop_called
            stop_called = True

    monkeypatch.setattr(outbox_worker, "SessionLocal", FakeSession)
    monkeypatch.setattr(outbox_worker, "AIOKafkaProducer", lambda **kwargs: FakeProducer())
    monkeypatch.setattr(outbox_worker, "ApplicationFactory", FakeFactory)

    with pytest.raises(asyncio.CancelledError):
        await outbox_worker.publish_outbox_forever()

    assert start_called, "Producer should have been started"
    assert stop_called, "Producer should have been stopped in finally"
