from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from scripts.backfill_im_group_id import (
    count_null_im_group_ids,
    fetch_monitoring_groups_with_null_im_group_id,
    find_im_group,
    process_group,
    run_backfill,
    verify_no_nulls,
)
from tests.conftest import MockResult, MockScalarResult


def _make_monitoring_group(**kwargs):
    return SimpleNamespace(
        id=kwargs.get("id", 1),
        messenger=kwargs.get("messenger", "whatsapp"),
        chat_id=kwargs.get("chat_id", "chat-1"),
        name=kwargs.get("name", "Test Group"),
        category=kwargs.get("category", "work"),
        im_group_id=kwargs.get("im_group_id", None),
    )


def _make_im_group(**kwargs):
    return SimpleNamespace(
        id=kwargs.get("id", 42),
        messenger=kwargs.get("messenger", "whatsapp"),
        external_chat_id=kwargs.get("external_chat_id", "chat-1"),
        name=kwargs.get("name", "Test Group"),
        category=kwargs.get("category", "work"),
    )


@pytest.mark.asyncio
async def test_count_null_im_group_ids(mock_db_session):
    mock_db_session.execute.return_value = MockResult(scalar_one_return=5)
    result = await count_null_im_group_ids(mock_db_session)
    assert result == 5


@pytest.mark.asyncio
async def test_fetch_monitoring_groups_with_null_im_group_id(mock_db_session):
    mg = _make_monitoring_group()
    mock_db_session.scalars.return_value = MockScalarResult([mg])
    result = await fetch_monitoring_groups_with_null_im_group_id(mock_db_session)
    assert result == [mg]


@pytest.mark.asyncio
async def test_find_im_group_returns_cached_result(mock_db_session):
    cached = _make_im_group(id=7)
    lookup = {("whatsapp", "chat-1"): cached}
    result = await find_im_group(mock_db_session, "whatsapp", "chat-1", lookup)
    assert result == cached
    mock_db_session.scalars.assert_not_called()


@pytest.mark.asyncio
async def test_find_im_group_queries_when_not_cached(mock_db_session):
    ig = _make_im_group(id=42)
    mock_db_session.scalars.return_value = MockScalarResult([ig])
    lookup: dict = {}
    result = await find_im_group(mock_db_session, "whatsapp", "chat-1", lookup)
    assert result == ig
    assert lookup[("whatsapp", "chat-1")] == ig


@pytest.mark.asyncio
async def test_process_group_matched_sets_im_group_id(mock_db_session):
    mg = _make_monitoring_group(id=1, im_group_id=None)
    ig = _make_im_group(id=42)
    mock_db_session.scalars.return_value = MockScalarResult([ig])
    lookup: dict = {}

    status, detail = await process_group(mock_db_session, mg, lookup, dry_run=False)

    assert status == "matched"
    assert detail == 42
    assert mg.im_group_id == 42


@pytest.mark.asyncio
async def test_process_group_dry_run_does_not_modify(mock_db_session):
    mg = _make_monitoring_group(id=1, im_group_id=None)
    ig = _make_im_group(id=42)
    mock_db_session.scalars.return_value = MockScalarResult([ig])
    lookup: dict = {}

    status, detail = await process_group(mock_db_session, mg, lookup, dry_run=True)

    assert status == "matched"
    assert detail == 42
    assert mg.im_group_id is None


@pytest.mark.asyncio
async def test_process_group_dry_run_no_match_reports_would_create_stub(mock_db_session):
    mg = _make_monitoring_group(id=1, im_group_id=None)
    mock_db_session.scalars.return_value = MockScalarResult([])
    lookup: dict = {}

    status, detail = await process_group(mock_db_session, mg, lookup, dry_run=True)

    assert status == "would_create_stub"
    assert detail is None
    assert mg.im_group_id is None


@pytest.mark.asyncio
async def test_run_backfill_matching_group_links_im_group_id(mock_db_session):
    mg = _make_monitoring_group(id=1, im_group_id=None)
    ig = _make_im_group(id=42)

    mock_db_session.execute.side_effect = [
        MockResult(scalar_one_return=1),
        MockResult(scalar_one_return=0),
    ]
    mock_db_session.scalars.side_effect = [
        MockScalarResult([mg]),
        MockScalarResult([ig]),
    ]

    summary = await run_backfill(mock_db_session, dry_run=False)

    assert summary["null_count_before"] == 1
    assert summary["resolved"] == 1
    assert summary["stubs_created"] == 0
    assert summary["errors"] == 0
    assert mg.im_group_id == 42


@pytest.mark.asyncio
async def test_run_backfill_no_match_creates_stub(mock_db_session):
    mg = _make_monitoring_group(id=1, im_group_id=None)

    added_objects: list = []

    def fake_add(obj):
        added_objects.append(obj)

    async def fake_flush():
        for obj in added_objects:
            if hasattr(obj, "id") and obj.id is None:
                obj.id = 99

    class FakeNestedTransaction:
        async def __aenter__(self):
            return mock_db_session

        async def __aexit__(self, exc_type, exc, tb):
            return None

    mock_db_session.begin_nested = MagicMock(return_value=FakeNestedTransaction())
    mock_db_session.add = MagicMock(side_effect=fake_add)
    mock_db_session.flush.side_effect = fake_flush

    mock_db_session.execute.side_effect = [
        MockResult(scalar_one_return=1),
        MockResult(scalar_one_return=0),
    ]
    mock_db_session.scalars.side_effect = [
        MockScalarResult([mg]),
        MockScalarResult([]),
        MockScalarResult([]),
    ]

    summary = await run_backfill(mock_db_session, dry_run=False)

    assert summary["null_count_before"] == 1
    assert summary["resolved"] == 1
    assert summary["stubs_created"] == 1
    assert summary["errors"] == 0
    assert mg.im_group_id == 99
    assert len(added_objects) == 1
    stub = added_objects[0]
    assert stub.messenger == "whatsapp"
    assert stub.external_chat_id == "chat-1"
    assert stub.name == "Test Group"
    assert stub.category == "work"


@pytest.mark.asyncio
async def test_run_backfill_dry_run_makes_no_changes(mock_db_session):
    mg = _make_monitoring_group(id=1, im_group_id=None)

    mock_db_session.execute.return_value = MockResult(scalar_one_return=1)
    mock_db_session.scalars.side_effect = [
        MockScalarResult([mg]),
        MockScalarResult([]),
    ]

    summary = await run_backfill(mock_db_session, dry_run=True)

    assert summary["null_count_before"] == 1
    assert summary["resolved"] == 0
    assert summary["stubs_created"] == 0
    assert summary["errors"] == 0
    assert mg.im_group_id is None
    mock_db_session.add.assert_not_called()
    mock_db_session.flush.assert_not_called()


@pytest.mark.asyncio
async def test_run_backfill_no_null_rows_is_idempotent(mock_db_session):
    mock_db_session.execute.return_value = MockResult(scalar_one_return=0)

    summary = await run_backfill(mock_db_session, dry_run=False)

    assert summary["null_count_before"] == 0
    assert summary["resolved"] == 0
    assert summary["stubs_created"] == 0
    assert summary["errors"] == 0


@pytest.mark.asyncio
async def test_verify_no_nulls_passes(mock_db_session):
    mock_db_session.execute.return_value = MockResult(scalar_one_return=0)
    result = await verify_no_nulls(mock_db_session)
    assert result == 0


@pytest.mark.asyncio
async def test_verify_no_nulls_fails_with_remaining_ids(mock_db_session):
    mg = _make_monitoring_group(id=5, im_group_id=None)
    mock_db_session.execute.return_value = MockResult(scalar_one_return=1)
    mock_db_session.scalars.return_value = MockScalarResult([mg])

    with pytest.raises(RuntimeError, match="Backfill incomplete: 1 row\\(s\\) still NULL: \\[5\\]"):
        await verify_no_nulls(mock_db_session)
