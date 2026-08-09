import json
import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.db.models import ModerationComment, ProcessedEvent
from app.modules.keywords.matcher import build_keyword_candidates
from app.modules.moderation.consumer import ProjectionConsumer, TaskLifecycleConsumer
from app.modules.moderation.service import ModerationService
from common.events import ContentCanonicalCommentsChangedV1, WireEvent


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeSession:
    pass


class FakeCrud:
    def __init__(self, *, processed: bool = False):
        self.processed = processed
        self.upserts = []
        self.marked = []
        self.revisions = {}

    async def is_processed(self, event_id):
        return self.processed

    async def apply_canonical_comment(
        self,
        payload,
        post_revision,
        *,
        allow_equal_revision=False,
    ):
        external_key = payload["external_key"]
        current = self.revisions.get(external_key)
        if current is not None:
            if post_revision < current:
                return False
            if post_revision == current and not allow_equal_revision:
                return False
        self.revisions[external_key] = post_revision
        self.upserts.append(payload)
        return True

    async def mark_processed(self, event_id, event_type):
        self.marked.append((event_id, event_type))


class FakeKeywordRepository:
    def __init__(self, words: list[str]):
        keywords = [SimpleNamespace(word=word, is_phrase=False, keyword_forms=[]) for word in words]
        self.candidates = build_keyword_candidates(keywords)

    async def load_candidates(self):
        return self.candidates


def canonical_event(comments, *, post_key="-123:456", revision=1):
    payload = ContentCanonicalCommentsChangedV1.model_validate(
        {
            "sourceService": "content-service",
            "sourceMessageId": str(uuid4()),
            "batchId": str(uuid4()),
            "postKey": post_key,
            "postRevision": revision,
            "chunkIndex": 0,
            "chunkCount": 1,
            "comments": comments,
        }
    )
    event = WireEvent.model_validate(
        {
            "event_id": str(uuid4()),
            "event_type": "content.canonical_comments_changed",
            "event_version": 1,
            "aggregate_type": "content_post",
            "aggregate_id": post_key,
            "payload": payload.model_dump(),
            "created_at": "2026-08-09T00:00:00+00:00",
        }
    )
    return event, payload


def task_completed_event(*, version: int = 1):
    task_id = 42
    return WireEvent.model_validate(
        {
            "event_id": str(uuid4()),
            "event_type": "task.completed",
            "event_version": version,
            "aggregate_type": "task",
            "aggregate_id": str(task_id),
            "payload": {
                "taskId": task_id,
                "runId": str(uuid4()),
                "ownerUserId": 7,
                "taskRevision": 3,
            },
            "created_at": "2026-08-09T00:00:00+00:00",
        }
    )


def service_with(crud, repository):
    service = ModerationService(FakeSession())
    service.crud = crud
    service.keyword_repository = repository
    return service


def test_model_tables_exist():
    assert ModerationComment.__tablename__ == "moderation_comments"
    assert ProcessedEvent.__tablename__ == "processed_events"
    names = {item.name for item in ProcessedEvent.__table__.constraints if item.name}
    assert "uq_processed_events_consumer_event" in names


@pytest.mark.anyio
async def test_handle_event_saves_matching_canonical_comment_and_marks_processed():
    crud = FakeCrud()
    service = service_with(crud, FakeKeywordRepository(["привет"]))
    event, payload = canonical_event(
        [
            {
                "ownerId": -123,
                "postId": 456,
                "commentId": 789,
                "authorId": 999,
                "createdAt": "2020-09-13T12:26:40+00:00",
                "text": "Привет, мир!",
            }
        ]
    )

    assert await service.handle_event(event, payload) is True
    assert crud.marked == [(event.event_id, "content.canonical_comments_changed")]
    assert crud.upserts[0]["external_key"] == "vk_-123_456_789"
    assert crud.upserts[0]["author_vk_id"] == 999
    assert crud.upserts[0]["matched_keywords"] == ["Привет"]


@pytest.mark.anyio
async def test_duplicate_canonical_event_is_replay_safe():
    crud = FakeCrud(processed=True)
    service = service_with(crud, FakeKeywordRepository(["привет"]))
    event, payload = canonical_event([])

    assert await service.handle_event(event, payload) is False
    assert crud.upserts == []
    assert crud.marked == []


@pytest.mark.anyio
async def test_task_completed_schedules_recalculation_once():
    crud = FakeCrud()
    service = service_with(crud, FakeKeywordRepository([]))
    service._schedule_recalculation = AsyncMock()
    event = task_completed_event()

    assert await service.handle_task_completed(event) is True
    service._schedule_recalculation.assert_awaited_once_with(event)
    assert crud.marked == [(event.event_id, "task.completed")]

    crud.processed = True
    service._schedule_recalculation.reset_mock()
    assert await service.handle_task_completed(event) is False
    service._schedule_recalculation.assert_not_awaited()


def test_unowned_canonical_payload_is_rejected():
    with pytest.raises(ValidationError):
        ContentCanonicalCommentsChangedV1.model_validate(
            {
                "sourceService": "vk-service",
                "sourceMessageId": str(uuid4()),
                "batchId": str(uuid4()),
                "postKey": "-1:2",
                "postRevision": 1,
                "chunkIndex": 0,
                "chunkCount": 1,
                "comments": [],
            }
        )


@pytest.mark.anyio
async def test_consumer_ignores_unrelated_content_event():
    consumer = ProjectionConsumer()
    raw = json.dumps(
        {
            "event_id": str(uuid4()),
            "event_type": "content.comments_projected",
            "event_version": 1,
            "aggregate_type": "content_post",
            "aggregate_id": "-1:2",
            "payload": {},
            "created_at": "2026-08-09T00:00:00+00:00",
        }
    ).encode()

    await consumer.handle_message(raw)


@pytest.mark.anyio
async def test_task_consumer_rejects_unsupported_version_before_db_access():
    consumer = TaskLifecycleConsumer()
    raw = task_completed_event(version=2).model_dump_json().encode()

    with pytest.raises(ValueError, match="unsupported task.completed version"):
        await consumer.handle_message(raw)


@pytest.mark.anyio
async def test_malformed_message_uses_standard_dlq_path():
    consumer = ProjectionConsumer()
    consumer._consumer = AsyncMock()
    msg = AsyncMock()
    msg.value = b"not valid json{{{"
    msg.offset = 42

    with patch("common.kafka.consumer_retry.send_to_dlq", new_callable=AsyncMock) as mock_send:
        await consumer._retry.handle_failure(
            msg,
            ValueError("invalid JSON"),
            consumer._consumer,
        )
        mock_send.assert_awaited_once()
    consumer._consumer.commit.assert_awaited_once()
