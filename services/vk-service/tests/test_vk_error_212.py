import sys
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.domain.exceptions.vk_api import VkApiDomainError
from app.infrastructure.vk_client.posts import PostsClient
from app.services.ingestion.comment_collector import CommentCollector


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeRepository:
    def __init__(self):
        self.authors = []

    async def upsert_author(self, author):
        self.authors.append(author)

    async def upsert_comment(self, comment, *, task_id):
        pass


class TestPostsClientGetComments:
    @pytest.mark.anyio
    async def test_returns_empty_on_error_212(self, caplog):
        call_method = AsyncMock(side_effect=VkApiDomainError(212, "Access to comments denied"))
        client = PostsClient(call_method=call_method)

        result = await client.get_comments(owner_id=-1, post_id=42)

        assert result == {"items": [], "profiles": [], "groups": []}
        assert "access to comments denied (VK error 212)" in caplog.text
        call_method.assert_awaited_once()

    @pytest.mark.anyio
    async def test_re_raises_on_non_212_error(self):
        call_method = AsyncMock(side_effect=VkApiDomainError(5, "User authorization failed"))
        client = PostsClient(call_method=call_method)

        with pytest.raises(VkApiDomainError) as exc_info:
            await client.get_comments(owner_id=-1, post_id=42)

        assert exc_info.value.code == 5
        call_method.assert_awaited_once()

    @pytest.mark.anyio
    async def test_returns_normal_response_when_no_error(self, caplog):
        call_method = AsyncMock(return_value={
            "items": [{"id": 1, "from_id": 1}],
            "profiles": [{"id": 1, "first_name": "John"}],
            "groups": [],
        })
        client = PostsClient(call_method=call_method)

        result = await client.get_comments(owner_id=-1, post_id=42)

        assert result["items"] == [{"id": 1, "from_id": 1}]
        assert "access to comments denied" not in caplog.text


class TestCommentCollectorCollectForPost:
    @pytest.mark.anyio
    async def test_returns_empty_on_error_212(self, caplog):
        adapter = AsyncMock(spec=[])
        adapter.get_comments = AsyncMock(side_effect=VkApiDomainError(212, "Access to comments denied"))
        collector = CommentCollector(adapter=adapter, repository=FakeRepository())

        result = await collector.collect_for_post(owner_id=-1, post_id=42, author_profiles={})

        assert result == []
        assert "access to comments denied (VK error 212)" in caplog.text
        adapter.get_comments.assert_awaited_once_with(-1, 42)

    @pytest.mark.anyio
    async def test_re_raises_on_non_212_error(self):
        adapter = AsyncMock(spec=[])
        adapter.get_comments = AsyncMock(side_effect=VkApiDomainError(5, "User authorization failed"))
        collector = CommentCollector(adapter=adapter, repository=FakeRepository())

        with pytest.raises(VkApiDomainError) as exc_info:
            await collector.collect_for_post(owner_id=-1, post_id=42, author_profiles={})

        assert exc_info.value.code == 5
        adapter.get_comments.assert_awaited_once()

    @pytest.mark.anyio
    async def test_enriches_author_profiles_on_success(self):
        profiles: dict[int, dict] = {}
        adapter = AsyncMock(spec=[])
        adapter.get_comments = AsyncMock(return_value={
            "items": [{"id": 100, "from_id": 1, "text": "hello"}],
            "profiles": [{"id": 1, "first_name": "John"}],
            "groups": [],
        })
        collector = CommentCollector(adapter=adapter, repository=FakeRepository())

        result = await collector.collect_for_post(owner_id=-1, post_id=42, author_profiles=profiles)

        assert len(result) == 1
        assert profiles[1] == {"id": 1, "first_name": "John"}
