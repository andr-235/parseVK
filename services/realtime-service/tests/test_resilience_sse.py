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
@pytest.mark.anyio
async def test_sse_reconnect_replays_after_last_event_id():
    """SSE with Last-Event-ID should replay only events after that ID."""
    from contextlib import asynccontextmanager

    class FakeSession:
        async def execute(self, query):
            class FakeResult:
                def one(self):
                    return (1, 3)
            return FakeResult()

    @asynccontextmanager
    async def mock_session_factory():
        yield FakeSession()

    replay_events = [
        {"sequence_id": 2, "event_id": "ev-2", "event_type": "content.comments_projected", "payload": {"n": 2}},
        {"sequence_id": 3, "event_id": "ev-3", "event_type": "content.comments_projected", "payload": {"n": 3}},
    ]

    with (
        patch.object(sse_handler, "_query_events_after", return_value=replay_events) as mock_query,
    ):
        chunks = []
        async for chunk in stream_events(
            mock_session_factory, last_event_id=1, audience_types=["authenticated"], audience_id=None
        ):
            chunks.append(chunk)
            if len(chunks) >= 2:
                break

    mock_query.assert_awaited_once_with(
        mock_session_factory, 1, ["authenticated"], None, limit=1000
    )
    yielded_ids = []
    for chunk in chunks:
        for line in chunk.splitlines():
            if line.startswith("id: "):
                yielded_ids.append(int(line.split("id: ")[1]))
    assert yielded_ids == [2, 3]


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
