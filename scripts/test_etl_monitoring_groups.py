"""Tests for scripts/etl_monitoring_groups.py."""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

# Ensure the sibling script is importable regardless of the cwd.
sys.path.insert(0, str(Path(__file__).parent))

from etl_monitoring_groups import (
    ETLStats,
    _category_distribution,
    _count_distinct_messenger_chat_id,
    _count_rows,
    _find_im_group_id,
    _insert_monitoring_group,
    _truncate_chat_id,
    run_etl,
)


class FakeRow:
    def __init__(self, id_, messenger, chat_id, name, category, created_at, updated_at):
        self.id = id_
        self.messenger = messenger
        self.chat_id = chat_id
        self.name = name
        self.category = category
        self.created_at = created_at
        self.updated_at = updated_at


@pytest.mark.asyncio
async def test_truncate_chat_id_short():
    stats = ETLStats()
    result = await _truncate_chat_id("short", 1, stats)
    assert result == "short"
    assert stats.truncated == 0


@pytest.mark.asyncio
async def test_truncate_chat_id_long():
    stats = ETLStats()
    long_id = "x" * 300
    result = await _truncate_chat_id(long_id, 42, stats)
    assert result == "x" * 256
    assert stats.truncated == 1


@pytest.mark.asyncio
async def test_count_rows():
    session = AsyncMock()
    result = MagicMock()
    result.scalar.return_value = 7
    session.execute.return_value = result
    count = await _count_rows(session, "monitoring_groups")
    assert count == 7


@pytest.mark.asyncio
async def test_count_distinct_messenger_chat_id():
    session = AsyncMock()
    result = MagicMock()
    result.scalar.return_value = 5
    session.execute.return_value = result
    count = await _count_distinct_messenger_chat_id(session, "monitoring_groups")
    assert count == 5


@pytest.mark.asyncio
async def test_category_distribution():
    session = AsyncMock()
    result = MagicMock()
    result.all.return_value = [("news", 3), (None, 2), ("sport", 1)]
    session.execute.return_value = result
    dist = await _category_distribution(session, "monitoring_groups")
    assert dist == {"news": 3, None: 2, "sport": 1}


@pytest.mark.asyncio
async def test_find_im_group_id_found():
    session = AsyncMock()
    result = MagicMock()
    result.one_or_none.return_value = (123,)
    session.execute.return_value = result
    group_id = await _find_im_group_id(session, "whatsapp", "chat-1")
    assert group_id == 123


@pytest.mark.asyncio
async def test_find_im_group_id_not_found():
    session = AsyncMock()
    result = MagicMock()
    result.one_or_none.return_value = None
    session.execute.return_value = result
    group_id = await _find_im_group_id(session, "whatsapp", "chat-1")
    assert group_id is None


@pytest.mark.asyncio
async def test_insert_monitoring_group_inserted():
    session = AsyncMock()
    result = MagicMock()
    result.rowcount = 1
    session.execute.return_value = result

    row = FakeRow(1, "whatsapp", "chat-1", "Group 1", "news", None, None)
    stats = ETLStats()
    await _insert_monitoring_group(session, row, "chat-1", 10, stats)
    assert stats.inserted == 1
    assert stats.skipped == 0


@pytest.mark.asyncio
async def test_insert_monitoring_group_skipped_duplicate():
    session = AsyncMock()
    result = MagicMock()
    result.rowcount = 0
    session.execute.return_value = result

    row = FakeRow(1, "whatsapp", "chat-1", "Group 1", "news", None, None)
    stats = ETLStats()
    await _insert_monitoring_group(session, row, "chat-1", 10, stats)
    assert stats.inserted == 0
    assert stats.skipped == 1


@pytest.mark.asyncio
async def test_insert_monitoring_group_skipped_after_truncation():
    session = AsyncMock()
    result = MagicMock()
    result.rowcount = 0
    session.execute.return_value = result

    original = "x" * 300
    truncated = original[:256]
    row = FakeRow(1, "whatsapp", original, "Group 1", "news", None, None)
    stats = ETLStats()
    await _insert_monitoring_group(session, row, truncated, 10, stats)
    assert stats.inserted == 0
    assert stats.skipped == 1


@pytest.mark.asyncio
async def test_run_etl_dry_run_does_not_write():
    content_session = AsyncMock()
    im_session = AsyncMock()

    im_count_result = MagicMock()
    im_count_result.scalar.return_value = 2

    content_result = MagicMock()
    content_result.all.return_value = [
        FakeRow(1, "whatsapp", "chat-1", "Group 1", "news", None, None),
        FakeRow(2, "max", "chat-2", "Group 2", "sport", None, None),
    ]

    im_session.execute.return_value = im_count_result
    content_session.execute.return_value = content_result

    stats = await run_etl(content_session, im_session, dry_run=True)

    assert stats.content_count == 2
    assert stats.im_count_before == 2
    assert stats.inserted == 0
    assert stats.skipped == 0
    assert stats.truncated == 0
    assert stats.no_im_group == []
    im_session.execute.assert_called_once()
    content_session.execute.assert_called_once()


@pytest.mark.asyncio
async def test_run_etl_dry_run_logs_counts(caplog):
    content_session = AsyncMock()
    im_session = AsyncMock()

    im_count_result = MagicMock()
    im_count_result.scalar.return_value = 0

    content_result = MagicMock()
    content_result.all.return_value = []

    im_session.execute.return_value = im_count_result
    content_session.execute.return_value = content_result

    with caplog.at_level("INFO"):
        await run_etl(content_session, im_session, dry_run=True)

    assert "ETL: content.monitoring_groups count=0, im.monitoring_groups count=0" in caplog.text
    assert "DRY RUN" in caplog.text
