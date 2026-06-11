import sys
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.sql.elements import TextClause

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path  # noqa: E402

use_service_path()

from app.db.models import ImMessage  # noqa: E402
from app.modules.monitoring.repository import MonitoringRepository  # noqa: E402


@pytest.fixture
def mock_session():
    session = AsyncMock()
    return session


def make_repository(rows, model_type=ImMessage):
    session = AsyncMock()
    scalars_mock = MagicMock()
    scalars_mock.all.return_value = rows
    result_mock = MagicMock()
    result_mock.scalars.return_value = scalars_mock
    session.execute = AsyncMock(return_value=result_mock)
    return MonitoringRepository(session), session


@pytest.mark.asyncio
async def test_find_messages_uses_sqlalchemy_statement():
    created_at = datetime(2026, 5, 25, 12, 0, tzinfo=UTC)
    msg = MagicMock(spec=ImMessage)
    msg.external_id = 10
    msg.text = None
    msg.created_at = created_at
    msg.author = "author1"
    msg.chat_name = "test chat"
    msg.messenger = "monitor_messages"
    msg.content_url = "https://cdn.example/file.jpg"
    msg.content_type = None

    repository, session = make_repository([msg])

    rows = await repository.find_messages(["test"], limit=20, offset=0)

    assert len(rows) == 1
    assert rows[0]["id"] == "10"
    assert rows[0]["text"] is None
    assert rows[0]["chat"] == "test chat"
    assert rows[0]["source"] == "monitor_messages"
    assert rows[0]["contentUrl"] == "https://cdn.example/file.jpg"

    executed_statement = session.execute.call_args[0][0]
    assert not isinstance(executed_statement, TextClause)


@pytest.mark.asyncio
async def test_get_groups_uses_sqlalchemy_statement():
    from app.db.models import MonitoringGroup

    group = MagicMock(spec=MonitoringGroup)
    group.id = 1
    group.name = "Group 1"
    group.messenger = "telegram"
    group.chat_id = "123"
    group.category = None

    session = AsyncMock()
    scalars_mock = MagicMock()
    scalars_mock.all.return_value = [group]
    result_mock = MagicMock()
    result_mock.scalars.return_value = scalars_mock
    session.execute = AsyncMock(return_value=result_mock)
    repository = MonitoringRepository(session)

    rows = await repository.get_groups()

    assert len(rows) == 1
    assert rows[0].name == "Group 1"

    executed_statement = session.execute.call_args[0][0]
    assert not isinstance(executed_statement, TextClause)


@pytest.mark.asyncio
async def test_find_distinct_chats_uses_sqlalchemy_statement():
    from sqlalchemy import Row

    row = MagicMock(spec=Row)
    row.messenger = "telegram"
    row.chat_external_id = "123"
    row.chat_name = "Chat 1"

    session = AsyncMock()
    result_mock = iter([row])
    session.execute = AsyncMock(return_value=result_mock)
    repository = MonitoringRepository(session)

    chats = await repository.find_distinct_chats()

    assert len(chats) == 1
    assert chats[0]["chatId"] == "123"

    executed_statement = session.execute.call_args[0][0]
    assert not isinstance(executed_statement, TextClause)
