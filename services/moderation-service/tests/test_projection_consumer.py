import sys
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from common.events import VkEvent

from app.db.models import ModerationComment, ProcessedEvent
from app.modules.keywords.matcher import build_keyword_candidates
from app.modules.moderation.service import ModerationService


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeSession:
    def __init__(self):
        self.commits = 0

    async def commit(self):
        self.commits += 1


class FakeCrud:
    def __init__(self, *, processed: bool = False):
        self.processed = processed
        self.upserts = []
        self.marked = []

    async def is_processed(self, event_id):
        return self.processed

    async def upsert_comment(self, payload):
        self.upserts.append(payload)
        return payload

    async def mark_processed(self, event_id, event_type):
        self.marked.append((event_id, event_type))


class FakeKeywordRepository:
    def __init__(self, words: list[str]):
        keywords = [
            SimpleNamespace(word=word, is_phrase=False, keyword_forms=[])
            for word in words
        ]
        self.candidates = build_keyword_candidates(keywords)

    async def load_candidates(self):
        return self.candidates

def envelope(event_type, payload):
    return VkEvent.model_validate(
        {
            "event_id": str(uuid4()),
            "event_type": event_type,
            "event_version": 1,
            "aggregate_id": "1",
            "payload": payload,
        }
    )


def service_with(crud: FakeCrud, repository: FakeKeywordRepository, session: FakeSession):
    service = ModerationService(session)
    service.crud = crud
    service.keyword_repository = repository
    return service

def test_model_tables_exist():
    assert ModerationComment.__tablename__ == "moderation_comments"
    assert ProcessedEvent.__tablename__ == "processed_events"
    names = {item.name for item in ProcessedEvent.__table__.constraints if item.name}
    assert "uq_processed_events_consumer_event" in names


@pytest.mark.anyio
async def test_handle_event_saves_matching_comment_and_marks_processed():
    session = FakeSession()
    crud = FakeCrud()
    service = service_with(crud, FakeKeywordRepository(["привет"]), session)
    event = envelope(
        "vk.comments_collected",
        {
            "comments": [
                {
                    "id": 789,
                    "owner_id": -123,
                    "post_id": 456,
                    "from_id": 999,
                    "date": 1600000000,
                    "text": "Привет, мир!",
                }
            ]
        },
    )

    result = await service.handle_event(event)

    assert result is True
    assert crud.marked == [(event.event_id, "vk.comments_collected")]
    assert len(crud.upserts) == 1
    saved = crud.upserts[0]
    assert saved["external_key"] == "vk_-123_456_789"
    assert saved["post_external_key"] == "vk_-123_456"
    assert saved["text"] == "Привет, мир!"
    assert saved["author_vk_id"] == 999
    assert saved["source"] == "VK"
    assert saved["matched_keywords"] == ["Привет"]


@pytest.mark.anyio
async def test_handle_event_skips_non_matching_comment_but_marks_processed():
    session = FakeSession()
    crud = FakeCrud()
    service = service_with(crud, FakeKeywordRepository(["опасно"]), session)
    event = envelope(
        "vk.comments_collected",
        {"comments": [{"id": 1, "owner_id": -1, "post_id": 2, "text": "обычный текст"}]},
    )

    result = await service.handle_event(event)

    assert result is True
    assert crud.upserts == []
    assert crud.marked == [(event.event_id, "vk.comments_collected")]


@pytest.mark.anyio
async def test_handle_duplicate_event_is_skipped():
    session = FakeSession()
    crud = FakeCrud(processed=True)
    service = service_with(crud, FakeKeywordRepository(["привет"]), session)
    event = envelope("vk.comments_collected", {"comments": []})

    result = await service.handle_event(event)

    assert result is False
    assert crud.upserts == []
    assert crud.marked == []


@pytest.mark.anyio
async def test_handle_processing_failure_sends_to_dlq_on_malformed_msg_moderation():
    from unittest.mock import AsyncMock, patch

    from app.modules.moderation.consumer import ProjectionConsumer

    consumer = ProjectionConsumer()
    consumer._consumer = AsyncMock()

    msg = AsyncMock()
    msg.value = b"not valid json{{{"
    msg.offset = 42

    with patch("common.kafka.consumer.send_to_dlq", new_callable=AsyncMock) as mock_send:
        await consumer._handle_processing_failure(msg)
        mock_send.assert_awaited_once()

    consumer._consumer.commit.assert_awaited_once()


@pytest.mark.anyio
async def test_skip_due_to_retry_backoff_preserves_offset_when_in_backoff_moderation():
    from datetime import UTC, datetime, timedelta
    from json import dumps
    from unittest.mock import AsyncMock
    from uuid import uuid4

    from app.modules.moderation.consumer import ProjectionConsumer

    consumer = ProjectionConsumer()
    consumer._consumer = AsyncMock()

    raw_value = dumps({
        "event_id": str(uuid4()),
        "event_type": "vk.comments_collected",
    }).encode()

    row = AsyncMock()
    row.next_retry_at = datetime.now(UTC) + timedelta(hours=1)
    row.retry_count = 1

    session = AsyncMock()
    session.scalar = AsyncMock(return_value=row)
    session.__aenter__ = AsyncMock(return_value=session)

    consumer.session_factory = lambda: session

    result = await consumer._skip_due_to_retry_backoff(raw_value)

    assert result is True
    consumer._consumer.commit.assert_not_awaited()


@pytest.mark.anyio
async def test_handle_batch_event_saves_matching_comments_and_marks_processed():
    session = FakeSession()
    crud = FakeCrud()
    service = service_with(crud, FakeKeywordRepository(["привет"]), session)
    event = envelope(
        "vk.comments_collected",
        {
            "comments": [
                {
                    "id": 1,
                    "owner_id": -1,
                    "post_id": 10,
                    "from_id": 100,
                    "date": 1600000000,
                    "text": "Привет, мир!",
                },
                {
                    "id": 2,
                    "owner_id": -1,
                    "post_id": 10,
                    "from_id": 101,
                    "date": 1600000001,
                    "text": "Обычный текст",
                },
                {
                    "id": 3,
                    "owner_id": -1,
                    "post_id": 10,
                    "from_id": 102,
                    "date": 1600000002,
                    "text": "Привет снова",
                },
            ]
        },
    )

    result = await service.handle_event(event)

    assert result is True
    assert crud.marked == [(event.event_id, "vk.comments_collected")]
    assert len(crud.upserts) == 2
    assert crud.upserts[0]["external_key"] == "vk_-1_10_1"
    assert crud.upserts[1]["external_key"] == "vk_-1_10_3"


@pytest.mark.anyio
async def test_handle_batch_event_with_no_matches_marks_processed_only():
    session = FakeSession()
    crud = FakeCrud()
    service = service_with(crud, FakeKeywordRepository(["опасно"]), session)
    event = envelope(
        "vk.comments_collected",
        {
            "comments": [
                {"id": 1, "owner_id": -1, "post_id": 10, "text": "обычный текст"},
                {"id": 2, "owner_id": -1, "post_id": 10, "text": "другой текст"},
            ]
        },
    )

    result = await service.handle_event(event)

    assert result is True
    assert crud.upserts == []
    assert crud.marked == [(event.event_id, "vk.comments_collected")]


@pytest.mark.anyio
async def test_handle_empty_batch_event_marks_processed_only():
    session = FakeSession()
    crud = FakeCrud()
    service = service_with(crud, FakeKeywordRepository(["привет"]), session)
    event = envelope("vk.comments_collected", {"comments": []})

    result = await service.handle_event(event)

    assert result is True
    assert crud.upserts == []
    assert crud.marked == [(event.event_id, "vk.comments_collected")]


@pytest.mark.anyio
async def test_handle_batch_event_skips_invalid_comments_and_continues():
    session = FakeSession()
    crud = FakeCrud()
    service = service_with(crud, FakeKeywordRepository(["привет"]), session)
    event = envelope(
        "vk.comments_collected",
        {
            "comments": [
                {
                    "id": 1,
                    "owner_id": -1,
                    "post_id": 10,
                    "from_id": 100,
                    "date": 1600000000,
                    "text": "Привет, мир!",
                },
                {
                    "id": None,
                    "owner_id": -1,
                    "post_id": 10,
                    "text": "Привет",
                },
                {
                    "id": 3,
                    "owner_id": -1,
                    "post_id": 10,
                    "from_id": 102,
                    "date": 1600000002,
                    "text": "Привет ещё раз",
                },
            ]
        },
    )

    result = await service.handle_event(event)

    assert result is True
    assert len(crud.upserts) == 2
    assert crud.upserts[0]["external_key"] == "vk_-1_10_1"
    assert crud.upserts[1]["external_key"] == "vk_-1_10_3"
