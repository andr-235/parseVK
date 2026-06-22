import sys
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.keywords.matcher import build_keyword_candidates
from app.modules.moderation.schemas import VkEvent
from app.modules.moderation.service import ModerationService


class FakeSession:
    def __init__(self):
        self.commits = 0

    async def commit(self):
        self.commits += 1


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


def event(payload):
    return VkEvent.model_validate(
        {
            "event_id": str(uuid4()),
            "event_type": "vk.comment_collected",
            "event_version": 1,
            "aggregate_id": "-1:2:3",
            "payload": payload,
        }
    )


@pytest.mark.anyio
async def test_matching_vk_comment_is_returned_by_comments_list():
    session = FakeSession()
    service = ModerationService(session)
    service.crud = InMemoryModerationCrud()
    service.keyword_repository = KeywordRepository(["опасно"])

    await service.handle_event(
        event(
            {
                "comment": {
                    "id": 3,
                    "owner_id": -1,
                    "post_id": 2,
                    "from_id": 42,
                    "date": 1700000000,
                    "text": "Это опасно",
                }
            }
        )
    )

    result = await service.get_comments(page=1, limit=25)

    assert session.commits == 1
    assert result["total"] == 1
    item = result["items"][0]
    assert item.external_key == "vk_-1_2_3"
    assert item.post_external_key == "vk_-1_2"
    assert item.author_vk_id == 42
    assert item.matched_keywords == ["опасно"]


@pytest.mark.anyio
async def test_non_matching_vk_comment_is_processed_but_not_listed():
    session = FakeSession()
    service = ModerationService(session)
    service.crud = InMemoryModerationCrud()
    service.keyword_repository = KeywordRepository(["опасно"])
    vk_event = event({"comment": {"id": 3, "owner_id": -1, "post_id": 2, "text": "обычно"}})

    await service.handle_event(vk_event)
    result = await service.get_comments(page=1, limit=25)

    assert vk_event.event_id in service.crud.processed
    assert result["items"] == []
    assert result["total"] == 0
