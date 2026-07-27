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
        self.posts = []
        self.comments = []
        self.incremented = []
        self.comment_counts = {}
        self.saved = 0

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

    async def increment_post_comments_count(self, post_external_key):
        self.incremented.append(post_external_key)

    async def count_comments_for_post_by_key(self, post_external_key):
        return self.comment_counts.get(post_external_key, len(self.comments))

    async def set_post_comments_count(self, post_external_key, count):
        self.comment_counts[post_external_key] = count

    async def get_comment_ids_for_post(self, post_key):
        owner_id, post_id = post_key.split(":")
        return {
            comment["id"]
            for comment, _ in self.comments
            if str(comment.get("owner_id", 0)) == owner_id
            and str(comment.get("post_id", 0)) == post_id
        }

    async def get_comment_ids_by_external_keys(self, keys):
        result = {}
        for key in keys:
            result[key] = await self.get_comment_ids_for_post(key)
        return result

    async def save(self):
        self.saved += 1


class FakeOutboxService:
    def __init__(self):
        self.events = []

    async def add_event(self, **kwargs):
        self.events.append(kwargs)


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
    service = ProjectionService(repository)

    await service.handle(envelope("vk.group_collected", {"group": {"id": 1, "name": "Group"}}))
    await service.handle(envelope("vk.author_collected", {"author": {"vk_author_id": 2, "type": "user"}}))
    await service.handle(envelope("vk.post_collected", {"taskId": 10, "post": {"owner_id": -1, "id": 3}}))
    await service.handle(
        envelope(
            "vk.comments_collected",
            {
                "taskId": 10,
                "comments": [{"owner_id": -1, "post_id": 3, "id": 4}],
                "authors": [],
            },
        )
    )

    assert repository.groups == [{"id": 1, "name": "Group"}]
    assert repository.authors == [{"vk_author_id": 2, "type": "user"}]
    assert repository.posts == [({"owner_id": -1, "id": 3}, 10)]
    assert repository.comments == [({"owner_id": -1, "post_id": 3, "id": 4}, 10)]
    assert repository.incremented == []
    assert repository.comment_counts == {"-1:3": 1}
    assert repository.saved == 4


@pytest.mark.anyio
async def test_duplicate_event_is_noop():
    repository = FakeRepository()
    service = ProjectionService(repository)
    event = envelope("vk.group_collected", {"group": {"id": 1}})

    assert await service.handle(event) is True
    assert await service.handle(event) is False
    assert repository.groups == [{"id": 1}]


@pytest.mark.anyio
async def test_projection_handles_batch_comments():
    repository = FakeRepository()
    outbox = FakeOutboxService()
    service = ProjectionService(repository, outbox)

    event = envelope(
        "vk.comments_collected",
        {
            "taskId": 10,
            "runId": "run-123",
            "batchId": "batch-1",
            "comments": [
                {"owner_id": -1, "post_id": 3, "id": 4},
                {"owner_id": -1, "post_id": 3, "id": 5},
            ],
            "authors": [
                {"vk_author_id": 7, "type": "user"},
            ],
        },
    )

    assert await service.handle(event) is True
    assert len(repository.authors) == 1
    assert len(repository.comments) == 2
    assert repository.comment_counts == {"-1:3": 2}
    assert len(outbox.events) == 1
    assert outbox.events[0]["event_type"] == "content.comments_projected"
    assert outbox.events[0]["aggregate_id"] == "-1:3"
    payload = outbox.events[0]["payload"]
    assert payload["insertedCount"] == 2
    assert payload["updatedCount"] == 0
    assert payload["totalCount"] == 2
    assert payload["taskId"] == 10
    assert payload["runId"] == "run-123"
    assert payload["ownerId"] == -1
    assert payload["postId"] == 3
    assert payload["batchId"] == "batch-1"
    assert payload["projectedAt"]
    assert repository.saved == 1


@pytest.mark.anyio
async def test_projection_skips_empty_batch_without_outbox():
    repository = FakeRepository()
    outbox = FakeOutboxService()
    service = ProjectionService(repository, outbox)

    event = envelope("vk.comments_collected", {"comments": [], "authors": []})

    assert await service.handle(event) is True
    assert repository.authors == []
    assert repository.comments == []
    assert outbox.events == []
    assert repository.saved == 1


@pytest.mark.anyio
async def test_handle_processing_failure_sends_to_dlq_on_malformed_msg():
    from unittest.mock import AsyncMock, patch

    from app.modules.projections.consumer import ProjectionConsumer

    consumer = ProjectionConsumer(session_factory=AsyncMock())
    consumer._consumer = AsyncMock()

    msg = AsyncMock()
    msg.value = b"not valid json{{{"
    msg.offset = 42

    with patch("common.kafka.consumer.send_to_dlq", new_callable=AsyncMock) as mock_send:
        await consumer._handle_processing_failure(msg)
        mock_send.assert_awaited_once()

    consumer._consumer.commit.assert_awaited_once()


@pytest.mark.anyio
async def test_skip_due_to_retry_backoff_commits_offset_when_in_backoff():
    from datetime import UTC, datetime, timedelta
    from json import dumps
    from types import SimpleNamespace
    from unittest.mock import AsyncMock
    from uuid import uuid4

    from app.modules.projections.consumer import ProjectionConsumer

    consumer = ProjectionConsumer()
    consumer._consumer = AsyncMock()

    raw_value = dumps({
        "event_id": str(uuid4()),
        "event_type": "vk.group_collected",
    }).encode()

    row = SimpleNamespace(
        next_retry_at=datetime.now(UTC) + timedelta(hours=1),
        retry_count=1,
    )

    async def scalar_mock(*a, **kw):
        return row

    session = AsyncMock()
    session.scalar = scalar_mock
    session.__aenter__ = AsyncMock(return_value=session)

    consumer.session_factory = lambda: session

    result = await consumer._skip_due_to_retry_backoff(raw_value)

    assert result is True
    consumer._consumer.commit.assert_awaited_once()
