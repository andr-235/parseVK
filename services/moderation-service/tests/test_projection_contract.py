import sys
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.keywords.matcher import build_keyword_candidates
from app.modules.moderation.service import ModerationService
from common.events import ContentCanonicalCommentsChangedV1, WireEvent


class FakeSession:
    async def commit(self):
        return None


class InMemoryModerationCrud:
    def __init__(self):
        self.items = []
        self.processed = set()

    async def is_processed(self, event_id):
        return event_id in self.processed

    async def upsert_comment(self, payload):
        row = SimpleNamespace(id=len(self.items) + 1, is_read=False, **payload)
        self.items.append(row)
        return row

    async def mark_processed(self, event_id, event_type):
        self.processed.add(event_id)

    async def get_comments(self, page, limit, read_status=None, search=None, keywords=None, keyword_source=None):
        return {
            "items": self.items[:limit],
            "total": len(self.items),
            "has_more": len(self.items) > limit,
            "read_count": 0,
            "unread_count": len(self.items),
        }


class KeywordRepository:
    def __init__(self, words):
        keywords = [SimpleNamespace(word=word, is_phrase=False, keyword_forms=[]) for word in words]
        self.candidates = build_keyword_candidates(keywords)

    async def load_candidates(self):
        return self.candidates


def event(comments):
    payload = ContentCanonicalCommentsChangedV1.model_validate(
        {
            "sourceService": "content-service",
            "sourceMessageId": str(uuid4()),
            "batchId": str(uuid4()),
            "postKey": "-1:2",
            "chunkIndex": 0,
            "chunkCount": 1,
            "comments": comments,
        }
    )
    wire = WireEvent.model_validate(
        {
            "event_id": str(uuid4()),
            "event_type": "content.canonical_comments_changed",
            "event_version": 1,
            "aggregate_type": "content_post",
            "aggregate_id": "-1:2",
            "payload": payload.model_dump(),
            "created_at": "2026-08-09T00:00:00+00:00",
        }
    )
    return wire, payload


@pytest.mark.anyio
async def test_matching_canonical_comment_is_returned_by_comments_list():
    service = ModerationService(FakeSession())
    service.crud = InMemoryModerationCrud()
    service.keyword_repository = KeywordRepository(["опасно"])
    wire, payload = event(
        [
            {
                "commentId": 3,
                "ownerId": -1,
                "postId": 2,
                "authorId": 42,
                "createdAt": "2023-11-14T22:13:20+00:00",
                "text": "Это опасно",
            }
        ]
    )

    await service.handle_event(wire, payload)
    result = await service.get_comments(page=1, limit=25)

    assert result["total"] == 1
    item = result["items"][0]
    assert item.external_key == "vk_-1_2_3"
    assert item.post_external_key == "vk_-1_2"
    assert item.author_vk_id == 42
    assert item.matched_keywords == ["опасно"]


@pytest.mark.anyio
async def test_non_matching_canonical_comment_is_processed_but_not_listed():
    service = ModerationService(FakeSession())
    service.crud = InMemoryModerationCrud()
    service.keyword_repository = KeywordRepository(["опасно"])
    wire, payload = event(
        [{"commentId": 3, "ownerId": -1, "postId": 2, "text": "обычно"}]
    )

    await service.handle_event(wire, payload)
    result = await service.get_comments(page=1, limit=25)

    assert wire.event_id in service.crud.processed
    assert result["items"] == []
    assert result["total"] == 0
