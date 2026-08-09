import sys
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from common.events import ContentCanonicalCommentsChangedV1, WireEvent

from app.modules.keywords.matcher import build_keyword_candidates
from app.modules.moderation.service import ModerationService


class FakeSession:
    async def commit(self):
        return None


class InMemoryModerationCrud:
    def __init__(self):
        self.items: dict[str, SimpleNamespace] = {}
        self.revisions: dict[str, int] = {}
        self.processed = set()

    async def is_processed(self, event_id):
        return event_id in self.processed

    async def apply_canonical_comment(
        self,
        payload,
        post_revision,
        *,
        allow_equal_revision=False,
    ):
        key = payload["external_key"]
        current = self.revisions.get(key)
        if current is not None:
            if post_revision < current:
                return False
            if post_revision == current and not allow_equal_revision:
                return False
        self.revisions[key] = post_revision
        if key in self.items:
            row = self.items[key]
            for field, value in payload.items():
                setattr(row, field, value)
        elif payload["matched_keywords"]:
            self.items[key] = SimpleNamespace(
                id=len(self.items) + 1,
                is_read=False,
                **payload,
            )
        return True

    async def mark_processed(self, event_id, event_type):
        self.processed.add(event_id)

    async def get_comments(
        self,
        page,
        limit,
        read_status=None,
        search=None,
        keywords=None,
        keyword_source=None,
    ):
        visible = [
            item
            for item in self.items.values()
            if item.matched_keywords
        ]
        return {
            "items": visible[:limit],
            "total": len(visible),
            "has_more": len(visible) > limit,
            "read_count": 0,
            "unread_count": len(visible),
        }


class KeywordRepository:
    def __init__(self, words):
        keywords = [SimpleNamespace(word=word, is_phrase=False, keyword_forms=[]) for word in words]
        self.candidates = build_keyword_candidates(keywords)

    async def load_candidates(self):
        return self.candidates


def event(
    comments,
    *,
    revision=1,
    chunk_index=0,
    chunk_count=1,
    post_key="-1:2",
):
    payload = ContentCanonicalCommentsChangedV1.model_validate(
        {
            "sourceService": "content-service",
            "sourceMessageId": str(uuid4()),
            "batchId": str(uuid4()),
            "postKey": post_key,
            "postRevision": revision,
            "chunkIndex": chunk_index,
            "chunkCount": chunk_count,
            "comments": comments,
        }
    )
    wire = WireEvent.model_validate(
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
    return wire, payload


def comment(comment_id, text):
    return {
        "commentId": comment_id,
        "ownerId": -1,
        "postId": 2,
        "authorId": 42,
        "createdAt": "2023-11-14T22:13:20+00:00",
        "text": text,
    }


@pytest.mark.anyio
async def test_matching_canonical_comment_is_returned_by_comments_list():
    service = ModerationService(FakeSession())
    service.crud = InMemoryModerationCrud()
    service.keyword_repository = KeywordRepository(["опасно"])
    wire, payload = event([comment(3, "Это опасно")])

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
    wire, payload = event([comment(3, "обычно")])

    await service.handle_event(wire, payload)
    result = await service.get_comments(page=1, limit=25)

    assert wire.event_id in service.crud.processed
    assert result["items"] == []
    assert result["total"] == 0
    assert service.crud.revisions["vk_-1_2_3"] == 1


@pytest.mark.anyio
async def test_newer_unmatched_revision_hides_previous_match():
    service = ModerationService(FakeSession())
    service.crud = InMemoryModerationCrud()
    service.keyword_repository = KeywordRepository(["опасно"])

    first_wire, first_payload = event([comment(3, "Это опасно")], revision=1)
    second_wire, second_payload = event([comment(3, "Теперь обычно")], revision=2)
    await service.handle_event(first_wire, first_payload)
    await service.handle_event(second_wire, second_payload)

    result = await service.get_comments(page=1, limit=25)
    assert result["total"] == 0
    assert service.crud.items["vk_-1_2_3"].matched_keywords == []
    assert service.crud.revisions["vk_-1_2_3"] == 2


@pytest.mark.anyio
async def test_reordered_older_event_cannot_overwrite_newer_projection():
    service = ModerationService(FakeSession())
    service.crud = InMemoryModerationCrud()
    service.keyword_repository = KeywordRepository(["опасно"])

    newer_wire, newer_payload = event([comment(3, "опасно новое")], revision=2)
    older_wire, older_payload = event([comment(3, "опасно старое")], revision=1)
    await service.handle_event(newer_wire, newer_payload)
    await service.handle_event(older_wire, older_payload)

    row = service.crud.items["vk_-1_2_3"]
    assert row.text == "опасно новое"
    assert service.crud.revisions["vk_-1_2_3"] == 2


@pytest.mark.anyio
async def test_same_revision_chunks_can_arrive_in_reverse_order():
    service = ModerationService(FakeSession())
    service.crud = InMemoryModerationCrud()
    service.keyword_repository = KeywordRepository(["опасно"])

    chunk_one_wire, chunk_one_payload = event(
        [comment(4, "опасно второй")],
        revision=3,
        chunk_index=1,
        chunk_count=2,
    )
    chunk_zero_wire, chunk_zero_payload = event(
        [comment(3, "опасно первый")],
        revision=3,
        chunk_index=0,
        chunk_count=2,
    )
    await service.handle_event(chunk_one_wire, chunk_one_payload)
    await service.handle_event(chunk_zero_wire, chunk_zero_payload)

    result = await service.get_comments(page=1, limit=25)
    assert result["total"] == 2
    assert service.crud.revisions["vk_-1_2_3"] == 3
    assert service.crud.revisions["vk_-1_2_4"] == 3
