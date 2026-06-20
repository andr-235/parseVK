import sys
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.domain.events.models import VkEvent
from app.infrastructure.db.models import (
    ContentAuthor,
    ContentComment,
    ContentGroup,
    ContentPost,
    ProcessedEvent,
)
from app.services.projections.vk import VkProjectionService


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeRepository:
    def __init__(self):
        self.processed = set()
        self.groups = []
        self.authors = []
        self.posts = []
        self.comments = []
        self.synced = []

    async def is_processed(self, consumer_name, event_id):
        return (consumer_name, event_id) in self.processed

    async def mark_processed(self, consumer_name, event_id, event_type):
        self.processed.add((consumer_name, event_id))

    async def upsert_group(self, group):
        self.groups.append(group)

    async def upsert_author(self, author):
        self.authors.append(author)

    async def upsert_post(self, post, *, task_id=None):
        self.posts.append((post, task_id))

    async def upsert_comment(self, comment, *, task_id=None):
        self.comments.append((comment, task_id))

    async def sync_post_comments_count(self, post_external_key):
        self.synced.append(post_external_key)


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
async def test_projection_upserts_vk_events_and_marks_processed():
    repository = FakeRepository()
    service = VkProjectionService(repository)

    await service.handle(envelope("vk.group_collected", {"group": {"id": 1, "name": "Group"}}))
    await service.handle(envelope("vk.author_collected", {"author": {"vk_author_id": 2, "type": "user"}}))
    await service.handle(envelope("vk.post_collected", {"taskId": 10, "post": {"owner_id": -1, "id": 3}}))
    await service.handle(
        envelope("vk.comment_collected", {"taskId": 10, "comment": {"owner_id": -1, "post_id": 3, "id": 4}})
    )

    assert repository.groups == [{"id": 1, "name": "Group"}]
    assert repository.authors == [{"vk_author_id": 2, "type": "user"}]
    assert repository.posts == [({"owner_id": -1, "id": 3}, 10)]
    assert repository.comments == [({"owner_id": -1, "post_id": 3, "id": 4}, 10)]
    assert repository.synced == ["-1:3"]


@pytest.mark.anyio
async def test_duplicate_event_is_noop():
    repository = FakeRepository()
    service = VkProjectionService(repository)
    event = envelope("vk.group_collected", {"group": {"id": 1}})

    assert await service.handle(event) is True
    assert await service.handle(event) is False
    assert repository.groups == [{"id": 1}]
