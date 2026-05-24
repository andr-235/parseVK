import sys
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.db.models import ModerationComment  # noqa: E402
from app.modules.moderation.service import ModerationService  # noqa: E402


class _StatsResult:
    def __init__(self, read_count: int, unread_count: int):
        self._row = SimpleNamespace(read_count=read_count, unread_count=unread_count)

    def one(self):
        return self._row


class _ScalarsResult:
    def __init__(self, items: list[ModerationComment]):
        self._items = items

    def scalars(self):
        return self

    def all(self):
        return self._items


class RecordingSession:
    def __init__(self, stats: tuple[int, int], items: list[ModerationComment]):
        self._stats = stats
        self._items = items
        self.statements = []

    async def execute(self, statement):
        self.statements.append(statement)
        if len(self.statements) == 1:
            return _StatsResult(*self._stats)
        return _ScalarsResult(self._items)


def make_comment(id: int, *, is_read: bool, matched_keywords: list[str]) -> ModerationComment:
    return ModerationComment(
        id=id,
        external_key=f"1:2:{id}",
        post_external_key="1:2",
        text=f"Comment {id}",
        date=datetime(2026, 1, id, tzinfo=UTC),
        author_vk_id=1000 + id,
        is_read=is_read,
        source="TASK",
        matched_keywords=matched_keywords,
    )


@pytest.mark.anyio
async def test_get_comments_counts_before_read_status_and_slices_limit_plus_one():
    items = [
        make_comment(3, is_read=True, matched_keywords=["foo"]),
        make_comment(2, is_read=True, matched_keywords=["foo"]),
        make_comment(1, is_read=True, matched_keywords=["foo"]),
    ]
    session = RecordingSession(stats=(3, 2), items=items)

    result = await ModerationService(session).get_comments(page=1, limit=2, read_status="read")

    assert result["read_count"] == 3
    assert result["unread_count"] == 2
    assert result["total"] == 3
    assert result["has_more"] is True
    assert [comment.id for comment in result["items"]] == [3, 2]


@pytest.mark.anyio
async def test_get_comments_total_uses_unread_count_after_read_status():
    items = [
        make_comment(2, is_read=False, matched_keywords=["bar"]),
        make_comment(1, is_read=False, matched_keywords=["bar"]),
    ]
    session = RecordingSession(stats=(1, 2), items=items)

    result = await ModerationService(session).get_comments(page=1, limit=10, read_status="unread")

    assert result["read_count"] == 1
    assert result["unread_count"] == 2
    assert result["total"] == 2
    assert result["has_more"] is False
    assert [comment.id for comment in result["items"]] == [2, 1]


def test_build_base_filters_keeps_multi_keyword_or_filter():
    service = ModerationService(session=object())

    filters = service._build_base_filters(search="needle", keywords=["foo", " ", "bar"])

    assert len(filters) == 2
    compiled_keyword_filter = str(filters[1].compile(compile_kwargs={"literal_binds": True}))
    assert "matched_keywords" in compiled_keyword_filter
    assert "foo" in compiled_keyword_filter
    assert "bar" in compiled_keyword_filter
