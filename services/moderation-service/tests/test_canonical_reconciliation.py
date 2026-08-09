import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.keywords.matcher import build_keyword_candidates
from app.modules.moderation import reconcile_canonical_content as reconciliation


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeBegin:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False


class FakeSession:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    def begin(self):
        return FakeBegin()


class FakeSessionMaker:
    def __init__(self):
        self.sessions = []

    def __call__(self):
        session = FakeSession()
        self.sessions.append(session)
        return session


class FakeKeywordRepository:
    def __init__(self, session):
        self.session = session

    async def load_candidates(self):
        keyword = SimpleNamespace(word="привет", is_phrase=False, keyword_forms=[])
        return build_keyword_candidates([keyword])


class FakeCrud:
    applications = []

    def __init__(self, session, on_enrich):
        self.session = session

    async def apply_canonical_comment(
        self,
        payload,
        post_revision,
        *,
        allow_equal_revision=False,
    ):
        self.applications.append((payload, post_revision, allow_equal_revision))
        return True


class FakeContentClient:
    async def fetch_page(self, *, after_id, limit):
        assert after_id is None
        assert limit == 500
        return {
            "items": [
                {
                    "id": 1,
                    "externalKey": "-123:456:1",
                    "postExternalKey": "-123:456",
                    "vkOwnerId": -123,
                    "vkPostId": 456,
                    "vkCommentId": 1,
                    "authorVkId": 10,
                    "date": "2026-08-09T00:00:00+00:00",
                    "text": "Привет, мир",
                    "postRevision": 8,
                },
                {
                    "id": 2,
                    "externalKey": "-123:456:2",
                    "postExternalKey": "-123:456",
                    "vkOwnerId": -123,
                    "vkPostId": 456,
                    "vkCommentId": 2,
                    "authorVkId": 11,
                    "date": "2026-08-09T00:01:00+00:00",
                    "text": "без совпадений",
                    "postRevision": 8,
                },
            ],
            "nextAfterId": 2,
            "hasMore": False,
        }


@pytest.mark.anyio
async def test_reconciliation_applies_canonical_snapshot_with_equal_revision_allowed(monkeypatch):
    FakeCrud.applications = []
    monkeypatch.setattr(reconciliation, "KeywordMatchRepository", FakeKeywordRepository)
    monkeypatch.setattr(reconciliation, "ModerationCrudService", FakeCrud)

    reconciler = reconciliation.ModerationCanonicalReconciler(
        session_maker=FakeSessionMaker(),
        content_client=FakeContentClient(),
    )

    stats = await reconciler.run(limit=500)

    assert stats.pages == 1
    assert stats.scanned == 2
    assert stats.matching == 1
    assert stats.applied == 2
    assert stats.stale == 0
    first_payload, first_revision, first_allow_equal = FakeCrud.applications[0]
    second_payload, second_revision, second_allow_equal = FakeCrud.applications[1]
    assert first_payload["external_key"] == "vk_-123_456_1"
    assert first_payload["matched_keywords"] == ["Привет"]
    assert second_payload["matched_keywords"] == []
    assert first_revision == second_revision == 8
    assert first_allow_equal is True
    assert second_allow_equal is True


def test_reconciliation_rejects_canonical_identity_mismatch():
    with pytest.raises(
        reconciliation.CanonicalReconciliationError,
        match="externalKey mismatch",
    ):
        reconciliation._canonical_comment_from_api(
            {
                "externalKey": "-1:2:999",
                "postExternalKey": "-1:2",
                "vkOwnerId": -1,
                "vkPostId": 2,
                "vkCommentId": 3,
                "authorVkId": None,
                "date": None,
                "text": "text",
                "postRevision": 1,
            }
        )


def test_reconciliation_rejects_missing_or_invalid_post_revision():
    row = {
        "externalKey": "-1:2:3",
        "postExternalKey": "-1:2",
        "vkOwnerId": -1,
        "vkPostId": 2,
        "vkCommentId": 3,
        "authorVkId": None,
        "date": None,
        "text": "text",
    }
    with pytest.raises(reconciliation.CanonicalReconciliationError):
        reconciliation._canonical_comment_from_api(row)
    row["postRevision"] = 0
    with pytest.raises(reconciliation.CanonicalReconciliationError):
        reconciliation._canonical_comment_from_api(row)
