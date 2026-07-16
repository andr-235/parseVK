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


@pytest.mark.asyncio
async def test_supervise_completes_successfully():
    """supervise runs a worker that completes without error."""
    health = [False]

    async def good_worker():
        health[0] = True

    await supervise("test-good", good_worker, health_flag=health)
    assert health[0] is True


@pytest.mark.asyncio
async def test_supervise_sets_health_flag():
    """supervise sets health_flag True on start."""
    health = [False]

    async def worker():
        pass

    await supervise("test-health", worker, health_flag=health)
    assert health[0] is True


@pytest.mark.asyncio
async def test_supervise_handles_cancelled_error():
    """supervise exits cleanly on CancelledError."""
    health = [True]

    async def cancelling_worker():
        raise asyncio.CancelledError()

    await supervise("test-cancel", cancelling_worker, health_flag=health)
    assert health[0] is False


@pytest.mark.asyncio
async def test_supervise_without_health_flag():
    """supervise works without a health_flag."""

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
