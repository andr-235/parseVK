import sys
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

import asyncio
from types import SimpleNamespace

from app.domain.exceptions.vk_api import (
    VkApiDomainError,
    VkApiInfrastructureError,
    VkApiRateLimitError,
)
from app.domain.repositories.checkpoint import CheckpointData, IngestionCheckpointStore
from app.infrastructure.vk_client.posts import PostsClient
from app.services.ingestion.comment_collector import CommentCollector


def _async_iter(items):
    async def generator():
        for item in items:
            yield item

    return generator()


async def _async_raise(exc):
    raise exc
    yield {}  # pragma: no cover


def _mock_iter_comment_pages(pages):
    def _iter(*args, **kwargs):
        return _async_iter(pages)

    return _iter


def _mock_iter_comment_pages_raise(exc):
    def _iter(*args, **kwargs):
        return _async_raise(exc)

    return _iter


class FakeCheckpointStore(IngestionCheckpointStore):
    def __init__(self):
        self.checkpoints: list[CheckpointData] = []

    async def load(self, run_id: str, owner_id: int, post_id: int) -> CheckpointData | None:
        return None

    async def save(self, checkpoint: CheckpointData) -> None:
        self.checkpoints.append(checkpoint)

    async def complete(self, run_id: str, owner_id: int, post_id: int) -> None:
        pass

    async def fail(self, run_id: str, owner_id: int, post_id: int, error: str) -> None:
        pass


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeRepository:
    def __init__(self):
        self.authors = []
        self.comments = []

    async def upsert_author(self, author):
        self.authors.append(author)

    async def upsert_comment(self, comment, *, task_id):
        self.comments.append((comment, task_id))


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
        call_method = AsyncMock(
            return_value={
                "items": [{"id": 1, "from_id": 1}],
                "profiles": [{"id": 1, "first_name": "John"}],
                "groups": [],
            }
        )
        client = PostsClient(call_method=call_method)

        result = await client.get_comments(owner_id=-1, post_id=42)

        assert result["items"] == [{"id": 1, "from_id": 1}]
        assert "access to comments denied" not in caplog.text


class TestPostsClientIterCommentPages:
    @pytest.mark.anyio
    async def test_yields_empty_page_on_error_212(self, caplog):
        call_method = AsyncMock(side_effect=VkApiDomainError(212, "Access to comments denied"))
        client = PostsClient(call_method=call_method)

        pages = [page async for page in client.iter_comment_pages(-1, 42)]

        assert pages == [{"items": [], "profiles": [], "groups": []}]
        assert "access to comments denied (VK error 212)" in caplog.text

    @pytest.mark.anyio
    async def test_re_raises_on_non_212_domain_error(self):
        call_method = AsyncMock(side_effect=VkApiDomainError(5, "User authorization failed"))
        client = PostsClient(call_method=call_method)

        with pytest.raises(VkApiDomainError) as exc_info:
            await anext(client.iter_comment_pages(-1, 42))

        assert exc_info.value.code == 5

    @pytest.mark.anyio
    async def test_retries_infrastructure_error(self, monkeypatch):
        call_method = AsyncMock(
            side_effect=[
                VkApiInfrastructureError(10, "server error"),
                {"items": [{"id": 1}], "profiles": [], "groups": [], "count": 1},
            ]
        )
        client = PostsClient(call_method=call_method)
        monkeypatch.setattr(asyncio, "sleep", AsyncMock())

        pages = [page async for page in client.iter_comment_pages(-1, 42)]

        assert len(pages) == 1
        assert pages[0]["items"] == [{"id": 1}]
        assert call_method.await_count == 2

    @pytest.mark.anyio
    async def test_retries_rate_limit_error(self, monkeypatch):
        call_method = AsyncMock(
            side_effect=[
                VkApiRateLimitError(6, "too fast"),
                {"items": [{"id": 1}], "profiles": [], "groups": [], "count": 1},
            ]
        )
        client = PostsClient(call_method=call_method)
        monkeypatch.setattr(asyncio, "sleep", AsyncMock())

        pages = [page async for page in client.iter_comment_pages(-1, 42)]

        assert len(pages) == 1
        assert pages[0]["items"] == [{"id": 1}]
        assert call_method.await_count == 2

    @pytest.mark.anyio
    async def test_re_raises_cancelled_error(self):
        call_method = AsyncMock(side_effect=asyncio.CancelledError())
        client = PostsClient(call_method=call_method)

        with pytest.raises(asyncio.CancelledError):
            await anext(client.iter_comment_pages(-1, 42))


class TestCommentCollectorCollectForPost:
    @pytest.mark.anyio
    async def test_returns_zero_on_error_212(self, caplog):
        adapter = AsyncMock(spec=[])
        adapter.iter_comment_pages = _mock_iter_comment_pages(
            [{"items": [], "profiles": [], "groups": []}]
        )
        repository = FakeRepository()
        checkpoint_store = FakeCheckpointStore()
        collector = CommentCollector(adapter=adapter, repository=repository)
        task_run = SimpleNamespace(task_id=10, run_id="run-10")

        result = await collector.collect_for_post(
            owner_id=-1,
            post_id=42,
            author_profiles={},
            task_run=task_run,
            checkpoint_store=checkpoint_store,
        )

        assert result == 0
        assert checkpoint_store.checkpoints[-1].status == "completed"
        assert checkpoint_store.checkpoints[-1].owner_id == -1
        assert checkpoint_store.checkpoints[-1].post_id == 42

    @pytest.mark.anyio
    async def test_re_raises_on_non_212_error(self):
        adapter = AsyncMock(spec=[])
        adapter.iter_comment_pages = _mock_iter_comment_pages_raise(
            VkApiDomainError(5, "User authorization failed")
        )
        collector = CommentCollector(adapter=adapter, repository=FakeRepository())
        task_run = SimpleNamespace(task_id=10, run_id="run-10")

        with pytest.raises(VkApiDomainError) as exc_info:
            await collector.collect_for_post(
                owner_id=-1,
                post_id=42,
                author_profiles={},
                task_run=task_run,
                checkpoint_store=FakeCheckpointStore(),
            )

        assert exc_info.value.code == 5

    @pytest.mark.anyio
    async def test_upserts_comments_authors_and_checkpoint(self):
        profiles: dict[int, dict] = {}
        adapter = AsyncMock(spec=[])
        adapter.iter_comment_pages = _mock_iter_comment_pages(
            [
                {
                    "items": [{"id": 100, "from_id": 1, "text": "hello", "date": 1_700_000_000}],
                    "profiles": [{"id": 1, "first_name": "John"}],
                    "groups": [],
                },
                {"items": [], "profiles": [], "groups": []},
            ]
        )
        repository = FakeRepository()
        checkpoint_store = FakeCheckpointStore()
        collector = CommentCollector(adapter=adapter, repository=repository)
        task_run = SimpleNamespace(task_id=10, run_id="run-10")

        result = await collector.collect_for_post(
            owner_id=-1,
            post_id=42,
            author_profiles=profiles,
            task_run=task_run,
            checkpoint_store=checkpoint_store,
            group_id=1,
        )

        assert result == 1
        assert profiles[1] == {"id": 1, "first_name": "John"}
        assert repository.authors[0]["vk_author_id"] == 1
        assert repository.comments[0] == (
            {"id": 100, "from_id": 1, "text": "hello", "date": 1_700_000_000},
            10,
        )
        assert checkpoint_store.checkpoints[0].status == "in_progress"
        assert checkpoint_store.checkpoints[0].group_id == 1
        assert checkpoint_store.checkpoints[0].last_comment_id == 100
        assert checkpoint_store.checkpoints[-1].status == "completed"
