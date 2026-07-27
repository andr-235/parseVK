import asyncio
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.stream import sse_handler
from app.modules.stream.sse_handler import stream_events


# scenario: 9 - SSE reconnect with Last-Event-ID
@pytest.mark.skip(reason="requires running realtime-service")
@pytest.mark.anyio
async def test_sse_reconnect_replays_after_last_event_id():
    """
    Procedure:
    1. Open an SSE stream without a cursor and wait for a few events.
    2. Disconnect the client (abort the HTTP connection).
    3. Reconnect with Last-Event-ID set to the last seen sequence_id.
    4. Assert that events with sequence_id > Last-Event-ID are replayed before live events resume.
    """


# scenario: 10 - Cursor beyond retention
@pytest.mark.anyio
async def test_cursor_beyond_retention_sends_resync():
    from contextlib import asynccontextmanager

    class FakeSession:
        async def execute(self, query):
            class FakeResult:
                def one(self):
                    return (1, 5)
            return FakeResult()

    @asynccontextmanager
    async def mock_session_factory():
        yield FakeSession()

    with (
        patch.object(sse_handler, "_query_events_after", return_value=[]) as mock_query,
    ):
        chunks = []
        async for chunk in stream_events(
            mock_session_factory, last_event_id=100, audience_types=["authenticated"], audience_id=None
        ):
            chunks.append(chunk)
            if "resync_required" in chunk:
                break

    assert any("resync_required" in chunk for chunk in chunks)
    assert any("cursor" in chunk for chunk in chunks)
    mock_query.assert_not_awaited()


# scenario: 10b - Cursor expired (behind retention window)
@pytest.mark.anyio
async def test_cursor_expired_sends_resync():
    from contextlib import asynccontextmanager

    class FakeSession:
        async def execute(self, query):
            class FakeResult:
                def one(self):
                    return (100, 200)
            return FakeResult()

    @asynccontextmanager
    async def mock_session_factory():
        yield FakeSession()

    with (
        patch.object(sse_handler, "_query_events_after", return_value=[]) as mock_query,
    ):
        chunks = []
        async for chunk in stream_events(
            mock_session_factory, last_event_id=50, audience_types=["authenticated"], audience_id=None
        ):
            chunks.append(chunk)
            if "resync_required" in chunk:
                break

    assert any("resync_required" in chunk for chunk in chunks)
    assert any("\"cursor\": 200" in chunk for chunk in chunks)
    mock_query.assert_not_awaited()


# scenario: 11 - Slow client drop
@pytest.mark.anyio
async def test_slow_client_disconnect_bounded_queue():
    from asyncio import Queue

    from app.core.config import settings

    queue: asyncio.Queue = Queue(maxsize=settings.max_send_queue_size)
    for i in range(settings.max_send_queue_size):
        queue.put_nowait({"sequence_id": i})

    async def try_enqueue(event: dict, timeout: float = 0.1) -> bool:
        try:
            await asyncio.wait_for(queue.put(event), timeout=timeout)
            return True
        except asyncio.TimeoutError:
            return False

    can_send = await try_enqueue({"sequence_id": 999}, timeout=0.1)
    assert can_send is False
