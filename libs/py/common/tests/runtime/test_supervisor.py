"""Tests for supervise() — background worker supervisor.

Covers crash restart, exponential backoff, CancelledError re-raise,
and the new health contract: supervisor does NOT call mark_cycle_success().
Workers are responsible for reporting their own cycle health.
"""

import asyncio
from unittest.mock import AsyncMock, patch

import pytest

from common.runtime.health import WorkerHealth
from common.runtime.supervisor import supervise


class _StopTest(BaseException):
    """Raised inside supervise's asyncio.sleep mock to terminate the infinite retry loop."""


@pytest.mark.asyncio
async def test_supervise_runs_worker_and_marks_started():
    """Worker completes normally; supervisor marks started, but is_healthy is False."""
    health = WorkerHealth()

    async def worker():
        pass

    await supervise("test", worker, health=health)
    assert health.running is True
    assert health.is_healthy is False  # supervisor doesn't report cycles


@pytest.mark.asyncio
async def test_supervise_cancelled_error_re_raised():
    """CancelledError is re-raised after marking stopped."""
    health = WorkerHealth()

    async def cancelling_worker():
        raise asyncio.CancelledError()

    with pytest.raises(asyncio.CancelledError):
        await supervise("test", cancelling_worker, health=health)
    assert health.running is False
    assert health.is_healthy is False


@pytest.mark.asyncio
async def test_supervise_restarts_on_crash():
    """Worker crashes once, supervisor restarts, worker succeeds on retry."""
    health = WorkerHealth()
    call_count = 0

    async def crash_once():
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise ValueError("first crash")

    with patch("common.runtime.supervisor.asyncio.sleep", AsyncMock()):
        await supervise("test", crash_once, health=health)
    assert health.last_crash == "first crash"
    assert call_count == 2  # crashed once, succeeded once


@pytest.mark.asyncio
async def test_supervise_exponential_backoff():
    """Retry delays follow: 1, 2, 4, 8, 16... capped at 30s."""
    health = WorkerHealth()
    delays: list[float] = []

    async def record_sleep(delay: float) -> None:
        delays.append(delay)
        if len(delays) >= 5:
            raise _StopTest()

    async def always_crash():
        raise RuntimeError("boom")

    with patch("common.runtime.supervisor.asyncio.sleep", record_sleep):
        with pytest.raises(_StopTest):
            await supervise("test", always_crash, health=health)

    assert delays == [1, 2, 4, 8, 16]


@pytest.mark.asyncio
async def test_supervise_success_after_retries():
    """Worker crashes twice, succeeds on third attempt. running=True, is_healthy=False."""
    health = WorkerHealth()
    call_count = 0

    async def crash_twice_then_succeed():
        nonlocal call_count
        call_count += 1
        if call_count <= 2:
            raise RuntimeError(f"crash #{call_count}")

    with patch("common.runtime.supervisor.asyncio.sleep", AsyncMock()):
        await supervise("test", crash_twice_then_succeed, health=health)
    assert health.running is True
    assert health.is_healthy is False  # supervisor doesn't set cycle health
    assert health.last_crash == "crash #2"


@pytest.mark.asyncio
async def test_supervise_without_health():
    """Supervise works without health parameter — no errors."""
    async def worker():
        pass

    await supervise("test", worker)
    # No assertion needed — verifying no exception is raised


@pytest.mark.asyncio
async def test_supervise_does_not_call_mark_cycle_success():
    """Supervisor never calls mark_cycle_success — workers do this themselves."""
    health = WorkerHealth()

    async def worker():
        pass

    with patch.object(health, "mark_cycle_success") as mock_success:
        await supervise("test", worker, health=health)
    mock_success.assert_not_called()


@pytest.mark.asyncio
async def test_supervise_marks_crashed_on_unhandled_exception():
    """On unhandled exception, supervisor calls mark_crashed and running stays False after crash."""
    health = WorkerHealth()
    call_count = 0

    async def always_crash():
        nonlocal call_count
        call_count += 1
        raise ValueError("unhandled error")

    async def sleep_once(delay: float) -> None:
        raise _StopTest()

    with patch("common.runtime.supervisor.asyncio.sleep", sleep_once):
        with pytest.raises(_StopTest):
            await supervise("test", always_crash, health=health)

    assert health.last_crash == "unhandled error"
    assert health.running is False  # mark_crashed sets running=False
