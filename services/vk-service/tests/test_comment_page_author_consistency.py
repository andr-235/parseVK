from types import SimpleNamespace

import pytest

from app.services.ingestion.comment_collector import CommentCollector


class PageAdapter:
    def iter_comment_pages(self, *args, **kwargs):
        async def pages():
            yield {
                "items": [{"id": 10, "from_id": 1, "date": 1_700_000_000}],
                "profiles": [
                    {
                        "id": 1,
                        "first_name": "Fresh",
                        "last_name": "Name",
                    }
                ],
                "groups": [],
                "count": 1,
            }

        return pages()


class RecordingRepository:
    def __init__(self):
        self.authors = []
        self.comments = []

    async def upsert_author(self, author):
        self.authors.append(author)

    async def upsert_comment(self, comment, *, task_id):
        self.comments.append(comment)

    async def count_comments_for_post(self, owner_id, post_id):
        return len(self.comments)


@pytest.mark.anyio
async def test_page_profile_replaces_stale_cached_author():
    repository = RecordingRepository()
    collector = CommentCollector(
        adapter=PageAdapter(),
        repository=repository,
    )
    profiles = {
        1: {
            "id": 1,
            "first_name": "Stale",
            "last_name": "Profile",
        }
    }

    await collector.collect_for_post(
        owner_id=-42,
        post_id=99,
        author_profiles=profiles,
        task_run=SimpleNamespace(task_id=5, run_id="run-5"),
        checkpoint_store=None,
    )

    assert profiles[1]["first_name"] == "Fresh"
    assert repository.authors == [
        {
            "vk_author_id": 1,
            "type": "user",
            "display_name": "Fresh Name",
            "first_name": "Fresh",
            "last_name": "Name",
            "photo_50": None,
            "photo_100": None,
            "photo_200": None,
            "domain": "",
            "screen_name": "",
            "raw": {"from_id": 1},
        }
    ]
