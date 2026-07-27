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
        self.failed: list[tuple[str, int, int, str]] = []

    async def load(self, run_id: str, owner_id: int, post_id: int) -> CheckpointData | None:
        for cp in reversed(self.checkpoints):
            if cp.run_id == run_id and cp.owner_id == owner_id and cp.post_id == post_id:
                return cp
        return None

    async def save(self, checkpoint: CheckpointData) -> None:
        self.checkpoints.append(checkpoint)

    async def complete(self, run_id: str, owner_id: int, post_id: int) -> None:
        pass

    async def fail(self, run_id: str, owner_id: int, post_id: int, error: str) -> None:
        self.failed.append((run_id, owner_id, post_id, error))


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeRepository:
    def __init__(self):
        self._authors: dict[int, dict] = {}
        self.comments = []

    @property
    def authors(self):
        return list(self._authors.values())

    async def upsert_author(self, author):
        self._authors[author["vk_author_id"]] = author

    async def upsert_comment(self, comment, *, task_id):
        self.comments.append((comment, task_id))

    async def count_comments_for_post(self, owner_id: int, post_id: int) -> int:
        # Count unique comment IDs (simulates DB dedup)
        def _matches(comment):
            if "owner_id" in comment and comment["owner_id"] != owner_id:
                return False
            if "post_id" in comment and comment["post_id"] != post_id:
                return False
            return True

        unique_ids = {c[0]["id"] for c in self.comments if _matches(c[0])}
        return len(unique_ids)


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

    @pytest.mark.anyio
    async def test_correct_page_count(self):
        call_method = AsyncMock(
            side_effect=[
                {"items": [{"id": i} for i in range(100)], "profiles": [], "groups": [], "count": 300},
                {"items": [{"id": i} for i in range(100, 200)], "profiles": [], "groups": [], "count": 300},
                {"items": [{"id": i} for i in range(200, 300)], "profiles": [], "groups": [], "count": 300},
            ]
        )
        client = PostsClient(call_method=call_method)

        pages = [page async for page in client.iter_comment_pages(-1, 42)]

        assert len(pages) == 3
        assert sum(len(p["items"]) for p in pages) == 300
        assert call_method.await_count == 3

    @pytest.mark.anyio
    async def test_pagination_respects_count(self):
        call_method = AsyncMock(
            side_effect=[
                {"items": [{"id": i} for i in range(100)], "profiles": [], "groups": [], "count": 250},
                {"items": [{"id": i} for i in range(100, 200)], "profiles": [], "groups": [], "count": 250},
                {"items": [{"id": i} for i in range(200, 250)], "profiles": [], "groups": [], "count": 250},
            ]
        )
        client = PostsClient(call_method=call_method)

        pages = [page async for page in client.iter_comment_pages(-1, 42)]

        assert len(pages) == 3
        assert call_method.call_args_list[0][1]["offset"] == 0
        assert call_method.call_args_list[1][1]["offset"] == 100
        assert call_method.call_args_list[2][1]["offset"] == 200

    @pytest.mark.anyio
    async def test_start_offset(self):
        call_method = AsyncMock(
            side_effect=[
                {"items": [{"id": i} for i in range(150, 250)], "profiles": [], "groups": [], "count": 300},
                {"items": [{"id": i} for i in range(250, 300)], "profiles": [], "groups": [], "count": 300},
            ]
        )
        client = PostsClient(call_method=call_method)

        pages = [page async for page in client.iter_comment_pages(-1, 42, start_offset=150)]

        assert len(pages) == 2
        assert call_method.call_args_list[0][1]["offset"] == 150
        assert call_method.call_args_list[1][1]["offset"] == 250

    @pytest.mark.anyio
    async def test_extended_1_passed(self):
        call_method = AsyncMock(return_value={"items": [], "profiles": [], "groups": [], "count": 0})
        client = PostsClient(call_method=call_method)

        pages = [page async for page in client.iter_comment_pages(-1, 42)]

        assert pages == [{"items": [], "profiles": [], "groups": []}]
        assert call_method.call_args_list[0][1]["extended"] == 1

    @pytest.mark.anyio
    async def test_empty_page_handling(self):
        call_method = AsyncMock(return_value={"items": [], "profiles": [], "groups": [], "count": 0})
        client = PostsClient(call_method=call_method)

        pages = [page async for page in client.iter_comment_pages(-1, 42)]

        assert pages == [{"items": [], "profiles": [], "groups": []}]
        assert call_method.await_count == 1

    @pytest.mark.anyio
    async def test_rate_limit_exhaustion(self, monkeypatch):
        call_method = AsyncMock(side_effect=VkApiRateLimitError(6, "Too many requests"))
        client = PostsClient(call_method=call_method)
        monkeypatch.setattr(asyncio, "sleep", AsyncMock())

        with pytest.raises(VkApiRateLimitError):
            await anext(client.iter_comment_pages(-1, 42, max_rate_limit_retries=3))

        assert call_method.await_count == 3

    @pytest.mark.anyio
    async def test_error_messages_sanitized(self, caplog, monkeypatch):
        call_method = AsyncMock(side_effect=VkApiInfrastructureError(10, "error with token vk1.abc123 in message"))
        client = PostsClient(call_method=call_method)
        monkeypatch.setattr(asyncio, "sleep", AsyncMock())

        with pytest.raises(VkApiInfrastructureError) as excinfo:
            await anext(client.iter_comment_pages(-1, 42, max_retries=1))

        assert "vk1.abc123" in str(excinfo.value)
        assert "vk1.abc123" not in caplog.text
        assert "<redacted>" in caplog.text

    @pytest.mark.anyio
    async def test_thread_items_count_passed(self):
        call_method = AsyncMock(return_value={"items": [], "profiles": [], "groups": [], "count": 0})
        client = PostsClient(call_method=call_method)

        pages = [page async for page in client.iter_comment_pages(-1, 42, thread_items_count=10)]

        assert pages == [{"items": [], "profiles": [], "groups": []}]
        assert call_method.call_args_list[0][1]["thread_items_count"] == 10

    @pytest.mark.anyio
    async def test_pagination_stops_when_offset_exceeds_count(self):
        call_method = AsyncMock(
            side_effect=[
                {"items": [{"id": i} for i in range(100)], "profiles": [], "groups": [], "count": 250},
                {"items": [{"id": i} for i in range(100, 200)], "profiles": [], "groups": [], "count": 250},
                {"items": [{"id": i} for i in range(200, 250)], "profiles": [], "groups": [], "count": 250},
            ]
        )
        client = PostsClient(call_method=call_method)

        pages = [page async for page in client.iter_comment_pages(-1, 42)]

        assert len(pages) == 3
        assert call_method.await_count == 3


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

    @pytest.mark.anyio
    async def test_multiple_pages(self):
        adapter = AsyncMock(spec=[])
        adapter.iter_comment_pages = _mock_iter_comment_pages(
            [
                {
                    "items": [
                        {"id": 1, "from_id": 1, "text": "first", "date": 1_700_000_000},
                        {"id": 2, "from_id": 2, "text": "second", "date": 1_700_000_001},
                    ],
                    "profiles": [{"id": 1, "first_name": "Alice"}, {"id": 2, "first_name": "Bob"}],
                    "groups": [],
                },
                {
                    "items": [
                        {"id": 3, "from_id": 1, "text": "third", "date": 1_700_000_002},
                    ],
                    "profiles": [],
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
            author_profiles={},
            task_run=task_run,
            checkpoint_store=checkpoint_store,
            group_id=1,
        )

        assert result == 3
        assert len(repository.comments) == 3
        assert len(repository.authors) == 2
        assert checkpoint_store.checkpoints[0].status == "in_progress"
        assert checkpoint_store.checkpoints[0].processed_comments == 2
        assert checkpoint_store.checkpoints[1].status == "in_progress"
        assert checkpoint_store.checkpoints[1].processed_comments == 3

    @pytest.mark.anyio
    async def test_resume_from_offset(self):
        adapter = AsyncMock(spec=[])
        adapter.iter_comment_pages = _mock_iter_comment_pages(
            [
                {
                    "items": [{"id": 101, "from_id": 1, "text": "resumed", "date": 1_700_000_000}],
                    "profiles": [{"id": 1, "first_name": "Alice"}],
                    "groups": [],
                },
                {"items": [], "profiles": [], "groups": []},
            ]
        )
        repository = FakeRepository()
        checkpoint_store = FakeCheckpointStore()
        checkpoint_store.checkpoints.append(
            CheckpointData(
                run_id="run-10",
                owner_id=-1,
                post_id=42,
                task_id=10,
                group_id=1,
                next_offset=100,
                status="in_progress",
            )
        )
        collector = CommentCollector(adapter=adapter, repository=repository)
        task_run = SimpleNamespace(task_id=10, run_id="run-10")

        result = await collector.collect_for_post(
            owner_id=-1,
            post_id=42,
            author_profiles={},
            task_run=task_run,
            checkpoint_store=checkpoint_store,
            start_offset=100,
            group_id=1,
        )

        assert result == 1
        assert checkpoint_store.checkpoints[-1].status == "in_progress"
        assert checkpoint_store.checkpoints[-1].next_offset == 101

    @pytest.mark.anyio
    async def test_overlap_re_read(self):
        """Tests collector behavior when upstream returns overlapping pages.

        The in-memory FakeRepository appends duplicates; real DB deduplication is
        covered by integration tests via ON CONFLICT.
        """
        adapter = AsyncMock(spec=[])
        adapter.iter_comment_pages = _mock_iter_comment_pages(
            [
                {
                    "items": [{"id": 1, "from_id": 1, "text": "first", "date": 1_700_000_000}],
                    "profiles": [{"id": 1, "first_name": "Alice"}],
                    "groups": [],
                },
                {
                    "items": [{"id": 1, "from_id": 1, "text": "first", "date": 1_700_000_000}],
                    "profiles": [{"id": 1, "first_name": "Alice"}],
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
            author_profiles={},
            task_run=task_run,
            checkpoint_store=checkpoint_store,
            group_id=1,
        )

        assert result == 1
        assert len(repository.comments) == 2
        assert len(repository.authors) == 1

    @pytest.mark.anyio
    async def test_page_committer_called(self):
        adapter = AsyncMock(spec=[])
        adapter.iter_comment_pages = _mock_iter_comment_pages(
            [
                {
                    "items": [{"id": 1, "from_id": 1, "text": "first", "date": 1_700_000_000}],
                    "profiles": [{"id": 1, "first_name": "Alice"}],
                    "groups": [],
                },
                {
                    "items": [{"id": 2, "from_id": 1, "text": "second", "date": 1_700_000_001}],
                    "profiles": [],
                    "groups": [],
                },
                {"items": [], "profiles": [], "groups": []},
            ]
        )
        repository = FakeRepository()
        checkpoint_store = FakeCheckpointStore()
        page_committer = AsyncMock()
        collector = CommentCollector(
            adapter=adapter,
            repository=repository,
            page_committer=page_committer,
        )
        task_run = SimpleNamespace(task_id=10, run_id="run-10")

        result = await collector.collect_for_post(
            owner_id=-1,
            post_id=42,
            author_profiles={},
            task_run=task_run,
            checkpoint_store=checkpoint_store,
            group_id=1,
        )

        assert result == 2
        assert page_committer.await_count == 2

    @pytest.mark.anyio
    async def test_authors_deduplicated_per_page(self):
        adapter = AsyncMock(spec=[])
        adapter.iter_comment_pages = _mock_iter_comment_pages(
            [
                {
                    "items": [
                        {"id": 1, "from_id": 1, "text": "a", "date": 1_700_000_000},
                        {"id": 2, "from_id": 1, "text": "b", "date": 1_700_000_001},
                        {"id": 3, "from_id": 2, "text": "c", "date": 1_700_000_002},
                    ],
                    "profiles": [{"id": 1, "first_name": "Alice"}, {"id": 2, "first_name": "Bob"}],
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
            author_profiles={},
            task_run=task_run,
            checkpoint_store=checkpoint_store,
            group_id=1,
        )

        assert result == 3
        assert len(repository.authors) == 2
        assert len(repository.comments) == 3
