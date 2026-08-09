import sys
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from common.events import VkEvent

from app.db.models import ContentAuthor, ContentComment, ContentGroup, ContentPost, ProcessedEvent
from app.modules.projections.service import ProjectionService


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeRepository:
    def __init__(self):
        self.processed = set()
        self.groups = []
        self.authors = []
        self.deleted = []
        self.saved = 0

    async def is_processed(self, consumer_name, event_id):
        return (consumer_name, event_id) in self.processed

    async def mark_processed(self, consumer_name, event_id, event_type):
        self.processed.add((consumer_name, event_id))

    async def upsert_group(self, group):
        self.groups.append(group)

    async def delete_group(self, group_id):
        self.deleted.append(group_id)

    async def upsert_author(self, author):
        self.authors.append(author)

    async def save(self):
        self.saved += 1


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


def test_model_tables_exist_and_processed_key_is_per_consumer():
    assert ContentGroup.__tablename__ == "content_groups"
    assert ContentAuthor.__tablename__ == "content_authors"
    assert ContentPost.__tablename__ == "content_posts"
    assert ContentComment.__tablename__ == "content_comments"
    assert ProcessedEvent.__tablename__ == "processed_events"
    names = {item.name for item in ProcessedEvent.__table__.constraints if item.name}
    assert "uq_processed_events_consumer_event" in names


@pytest.mark.anyio
async def test_projection_keeps_unrelated_group_and_author_events():
    repository = FakeRepository()
    service = ProjectionService(repository)

    assert await service.handle(
        envelope("vk.group_collected", {"group": {"id": 1, "name": "Group"}})
    )
    assert await service.handle(
        envelope("vk.author_collected", {"author": {"vk_author_id": 2, "type": "user"}})
    )
    assert repository.groups == [{"id": 1, "name": "Group"}]
    assert repository.authors == [{"vk_author_id": 2, "type": "user"}]
    assert repository.saved == 2


@pytest.mark.anyio
async def test_duplicate_event_is_noop():
    repository = FakeRepository()
    service = ProjectionService(repository)
    event = envelope("vk.group_collected", {"group": {"id": 1}})

    assert await service.handle(event) is True
    assert await service.handle(event) is False
    assert repository.groups == [{"id": 1}]


@pytest.mark.anyio
async def test_unsupported_projection_does_not_create_processed_marker():
    repository = FakeRepository()
    service = ProjectionService(repository)
    event = envelope("vk.unknown", {})

    assert await service.handle(event) is False
    assert repository.processed == set()
    assert repository.saved == 0


@pytest.mark.anyio
async def test_processing_failure_sends_poison_pill_to_dlq():
    from unittest.mock import AsyncMock, patch

    from app.modules.projections.consumer import ProjectionConsumer

    consumer = ProjectionConsumer(session_factory=AsyncMock())
    broker = AsyncMock()
    msg = AsyncMock()
    msg.value = b"not valid json{{{"
    msg.offset = 42
    msg.headers = []

    with patch("common.kafka.consumer_retry.send_to_dlq", new_callable=AsyncMock) as mock_send:
        await consumer._retry.handle_failure(msg, ValueError("invalid JSON"), broker)
        mock_send.assert_awaited_once()
    broker.commit.assert_awaited_once()
