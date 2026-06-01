import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from sqlalchemy.sql.elements import TextClause

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path  # noqa: E402

use_service_path()

from app.modules.monitoring.repository import MonitoringRepository  # noqa: E402


class FakeResult:
    def __init__(self, rows):
        self._rows = rows

    def __iter__(self):
        return iter(self._rows)


class FakeConnection:
    def __init__(self, rows, statements):
        self._rows = rows
        self._statements = statements

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return None

    async def execute(self, statement):
        self._statements.append(statement)
        return FakeResult(self._rows)


class FakeEngine:
    def __init__(self, rows):
        self._rows = rows
        self.statements = []

    def connect(self):
        return FakeConnection(self._rows, self.statements)


@pytest.fixture
def monitor_cfg():
    return SimpleNamespace(
        monitor_messages_table="monitor_messages",
        monitor_message_id_column="id",
        monitor_message_text_column="text",
        monitor_message_created_at_column="created_at",
        monitor_message_author_column="author",
        monitor_message_chat_column="chat",
        monitor_message_metadata_column="metadata",
        monitor_groups_table="monitor_groups",
        monitor_group_chat_id_column="chat_id",
        monitor_group_name_column="name",
        monitor_keywords_table="monitor_keywords",
        monitor_keyword_word_column="word",
    )


def make_repository(cfg, rows):
    engine = FakeEngine(rows)
    repository = MonitoringRepository(AsyncMock(), cfg=cfg, mon_engine=engine)
    return repository, engine


@pytest.mark.asyncio
async def test_find_external_messages_uses_sqlalchemy_statement(monitor_cfg):
    created_at = datetime(2026, 5, 25, 12, 0, tzinfo=UTC)
    metadata = {
        "raw": {
            "body": "fallback text",
            "s3Info": {"url": "https://cdn.example/file.jpg"},
        },
        "chatName": "fallback chat",
    }
    repository, engine = make_repository(
        monitor_cfg,
        [
            SimpleNamespace(
                id=10,
                text=None,
                createdAt=created_at,
                author="author1",
                chat=None,
                source="monitor_messages",
                metadata=json.dumps(metadata),
            )
        ],
    )

    rows = await repository.find_external_messages(["fallback"], limit=20, offset=0)

    assert rows == [
        {
            "id": "10",
            "text": "fallback text",
            "createdAt": created_at.isoformat(),
            "author": "author1",
            "chat": "fallback chat",
            "source": "monitor_messages",
            "contentUrl": "https://cdn.example/file.jpg",
            "contentType": None,
        }
    ]
    assert len(engine.statements) == 1
    assert not isinstance(engine.statements[0], TextClause)


@pytest.mark.asyncio
async def test_find_external_groups_uses_sqlalchemy_statement(monitor_cfg):
    repository, engine = make_repository(
        monitor_cfg,
        [SimpleNamespace(chatId="123", name="Group 1")],
    )

    rows = await repository.find_external_groups()

    assert rows == [{"chatId": "123", "name": "Group 1"}]
    assert len(engine.statements) == 1
    assert not isinstance(engine.statements[0], TextClause)


@pytest.mark.asyncio
async def test_find_external_keywords_uses_sqlalchemy_statement(monitor_cfg):
    repository, engine = make_repository(
        monitor_cfg,
        [
            SimpleNamespace(word=" alpha "),
            SimpleNamespace(word="beta"),
            SimpleNamespace(word=""),
            SimpleNamespace(word="alpha"),
        ],
    )

    words = await repository.find_external_keywords()

    assert words is not None
    assert sorted(words) == ["alpha", "beta"]
    assert len(engine.statements) == 1
    assert not isinstance(engine.statements[0], TextClause)
