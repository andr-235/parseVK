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


class CollisionPageAdapter:
    def iter_comment_pages(self, *args, **kwargs):
        async def pages():
            yield {
                "items": [
                    {"id": 10, "from_id": 42, "date": 1_700_000_000},
                    {"id": 11, "from_id": -42, "date": 1_700_000_001},
                ],
                "profiles": [
                    {"id": 42, "first_name": "User", "last_name": "FortyTwo"}
                ],
                "groups": [{"id": 42, "name": "Group FortyTwo"}],
                "count": 2,
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
    assert repository.authors[0]["display_name"] == "Fresh Name"


@pytest.mark.anyio
async def test_user_and_group_with_same_absolute_id_remain_distinct():
    repository = RecordingRepository()
    collector = CommentCollector(
        adapter=CollisionPageAdapter(),
        repository=repository,
    )
    profiles = {}

    await collector.collect_for_post(
        owner_id=-42,
        post_id=99,
        author_profiles=profiles,
        task_run=SimpleNamespace(task_id=5, run_id="run-5"),
        checkpoint_store=None,
    )

    assert profiles[42]["first_name"] == "User"
    assert profiles[-42]["name"] == "Group FortyTwo"
    authors = {author["vk_author_id"]: author for author in repository.authors}
    assert authors[42]["type"] == "user"
    assert authors[42]["display_name"] == "User FortyTwo"
    assert authors[-42]["type"] == "group"
    assert authors[-42]["display_name"] == "Group FortyTwo"
