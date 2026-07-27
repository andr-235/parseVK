"""Unit tests for the shared LISTEN/NOTIFY listener."""

from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.fixture
def realtime_listener():
    from app.modules.stream.listener import RealtimeListener

    return RealtimeListener("postgresql://user:pass@localhost/db")


@pytest.mark.anyio
async def test_listener_start_stop_registers_asyncpg_listener(realtime_listener):
    fake_conn = AsyncMock()
    fake_conn.is_closed.return_value = False

    with patch("asyncpg.connect", return_value=fake_conn) as mock_connect:
        await realtime_listener.start()

    mock_connect.assert_awaited_once_with("postgresql://user:pass@localhost/db")
    fake_conn.add_listener.assert_awaited_once_with("realtime_events", realtime_listener._on_notification)
    assert realtime_listener._conn is fake_conn
    assert realtime_listener._task is not None

    await realtime_listener.stop()

    fake_conn.remove_listener.assert_awaited_once_with("realtime_events", realtime_listener._on_notification)
    fake_conn.close.assert_awaited_once()
    assert realtime_listener._conn is None


@pytest.mark.anyio
async def test_listener_notifies_subscribers(realtime_listener):
    received = []

    def callback(seq: int):
        received.append(seq)

    realtime_listener.subscribe("sub-1", callback)
    realtime_listener._on_notification(None, 123, "realtime_events", "42")

    assert received == [42]


@pytest.mark.anyio
async def test_listener_ignores_invalid_payload(realtime_listener):
    called = False

    def callback(seq: int):
        nonlocal called
        called = True

    realtime_listener.subscribe("sub-1", callback)
    realtime_listener._on_notification(None, 123, "realtime_events", "not-a-number")

    assert called is False


@pytest.mark.anyio
async def test_listener_unsubscribe_removes_callback(realtime_listener):
    called = False

    def callback(seq: int):
        nonlocal called
        called = True

    realtime_listener.subscribe("sub-1", callback)
    realtime_listener.unsubscribe("sub-1")
    realtime_listener._on_notification(None, 123, "realtime_events", "1")

    assert called is False


@pytest.mark.anyio
async def test_listener_callback_exception_does_not_break_others(realtime_listener):
    received = []

    def bad_callback(seq: int):
        raise RuntimeError("boom")

    def good_callback(seq: int):
        received.append(seq)

    realtime_listener.subscribe("bad", bad_callback)
    realtime_listener.subscribe("good", good_callback)
    realtime_listener._on_notification(None, 123, "realtime_events", "7")

    assert received == [7]
