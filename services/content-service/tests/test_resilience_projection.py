import sys
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from common.events import VkEvent

from app.modules.projections.service import ProjectionService


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeRepository:
    def __init__(self, outbox=None):
        self.outbox = outbox
        self.processed = set()
        self.groups = []
        self.authors = []
        self.posts = []
        self.comments = []
        self.incremented = []
        self.comment_counts = {}
        self.projection_revisions: dict[str, int] = {}
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
        return len(await self.get_comment_ids_for_post(post_external_key))

    async def set_post_comments_count(self, post_external_key, count):
        self.comment_counts[post_external_key] = count

    async def increment_projection_revision(self, post_key):
        self.projection_revisions[post_key] = self.projection_revisions.get(post_key, 0) + 1
        return self.projection_revisions[post_key]

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
        if self.outbox:
            self.outbox.commit()
        self.saved += 1


class FakeOutboxService:
    def __init__(self):
        self.pending = []
        self.events = []

    async def add_event(self, **kwargs):
        kwargs.setdefault("status", "pending")
        self.pending.append(kwargs)

    def commit(self):
        self.events.extend(self.pending)
        self.pending = []


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


# scenario: 3 - Overlapping batches
@pytest.mark.anyio
async def test_overlapping_batches_exact_count():
    outbox = FakeOutboxService()
    repository = FakeRepository(outbox=outbox)
    service = ProjectionService(repository, outbox)

    event_one = envelope(
        "vk.comments_collected",
        {
            "taskId": 10,
            "runId": "run-1",
            "batchId": "batch-1",
            "comments": [
                {"owner_id": -1, "post_id": 3, "id": 4},
                {"owner_id": -1, "post_id": 3, "id": 5},
            ],
            "authors": [],
        },
    )
    event_two = envelope(
        "vk.comments_collected",
        {
            "taskId": 10,
            "runId": "run-1",
            "batchId": "batch-2",
            "comments": [
                {"owner_id": -1, "post_id": 3, "id": 5},
                {"owner_id": -1, "post_id": 3, "id": 6},
                {"owner_id": -1, "post_id": 3, "id": 7},
            ],
            "authors": [],
        },
    )

    assert await service.handle(event_one) is True
    assert await service.handle(event_two) is True

    comment_ids = {comment["id"] for comment, _ in repository.comments}
    assert comment_ids == {4, 5, 6, 7}
    assert len(repository.comments) == 5
    assert repository.comment_counts == {"-1:3": 4}
    assert len(outbox.events) == 2
    assert all(event["event_type"] == "content.comments_projected" for event in outbox.events)
    assert outbox.events[0]["payload"]["insertedCount"] == 2
    assert outbox.events[0]["payload"]["updatedCount"] == 0
    assert outbox.events[0]["payload"]["totalCount"] == 2
    assert outbox.events[1]["payload"]["insertedCount"] == 2
    assert outbox.events[1]["payload"]["updatedCount"] == 1
    assert outbox.events[1]["payload"]["totalCount"] == 4


# scenario: 4 - Crash before commit
class CrashBeforeCommitRepository(FakeRepository):
    async def save(self):
        raise RuntimeError("disk full")


@pytest.mark.anyio
async def test_crash_before_commit_no_projection_event():
    outbox = FakeOutboxService()
    repository = CrashBeforeCommitRepository(outbox=outbox)
    service = ProjectionService(repository, outbox)

    event = envelope(
        "vk.comments_collected",
        {
            "taskId": 10,
            "comments": [{"owner_id": -1, "post_id": 3, "id": 4}],
            "authors": [{"vk_author_id": 7, "type": "user"}],
        },
    )

    with pytest.raises(RuntimeError):
        await service.handle(event)

    assert outbox.events == []
    assert len(outbox.pending) == 1
    assert outbox.pending[0]["event_type"] == "content.comments_projected"


# scenario: 5 - Crash after commit before publish
@pytest.mark.anyio
async def test_crash_after_commit_outbox_retained():
    outbox = FakeOutboxService()
    repository = FakeRepository(outbox=outbox)
    service = ProjectionService(repository, outbox)

    event = envelope(
        "vk.comments_collected",
        {
            "taskId": 10,
            "comments": [{"owner_id": -1, "post_id": 3, "id": 4}],
            "authors": [{"vk_author_id": 7, "type": "user"}],
        },
    )

    assert await service.handle(event) is True
    assert len(outbox.events) == 1
    assert outbox.events[0]["status"] == "pending"

    # Simulate outbox publisher recovery: the pending row is picked up and published.
    outbox.events[0]["status"] = "published"
    assert outbox.events[0]["status"] == "published"


# scenario: duplicate batch event is idempotent
@pytest.mark.anyio
async def test_duplicate_batch_event_is_idempotent():
    """Processing the same vk.comments_collected event twice should be a no-op on second call."""
    outbox = FakeOutboxService()
    repository = FakeRepository(outbox=outbox)
    service = ProjectionService(repository, outbox)

    event = envelope(
        "vk.comments_collected",
        {
            "taskId": 10,
            "comments": [{"owner_id": -1, "post_id": 3, "id": 4}],
            "authors": [],
        },
    )

    # First call — normal processing
    assert await service.handle(event) is True
    assert len(repository.comments) == 1
    assert len(outbox.events) == 1

    # Second call with the same event_id — should be idempotent
    assert await service.handle(event) is False
    assert len(repository.comments) == 1  # no duplicate comment upsert
    assert len(outbox.events) == 1  # no duplicate outbox event
