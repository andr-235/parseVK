import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.ingestion.service import IngestionService
from app.modules.vk_api.client import VkApiClient, VkApiConfigurationError
from app.modules.vk_api.fake_client import FakeVkApiClient


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeRepository:
    def __init__(self):
        self.groups = []
        self.authors = []
        self.posts = []
        self.comments = []

    async def upsert_group(self, group):
        self.groups.append(group)

    async def upsert_author(self, author):
        self.authors.append(author)

    async def upsert_post(self, post, *, task_id, group_id=None):
        self.posts.append((post, task_id, group_id))

    async def upsert_comment(self, comment, *, task_id):
        self.comments.append((comment, task_id))


class FakeTasksClient:
    def __init__(self):
        self.calls = []

    async def update_progress(self, task_id, run_id, processed_items, total_items, progress, stats, **kwargs):
        self.calls.append(("progress", task_id, run_id, processed_items, total_items, progress, stats))

    async def complete_execution(self, task_id, run_id, processed_items, total_items, stats, **kwargs):
        self.calls.append(("complete", task_id, run_id, processed_items, total_items, stats))

    async def fail_execution(self, task_id, run_id, error, processed_items, total_items, stats, **kwargs):
        self.calls.append(("fail", task_id, run_id, error, processed_items, total_items, stats))


def task_run(scope="selected", group_ids=None):
    return SimpleNamespace(
        task_id=10,
        run_id="run-10",
        scope=scope,
        mode="recent_posts",
        group_ids=group_ids if group_ids is not None else [1],
        post_limit=1,
        processed_items=0,
        total_items=0,
    )


@pytest.mark.anyio
async def test_selected_task_collects_only_requested_groups():
    repository = FakeRepository()
    tasks_client = FakeTasksClient()
    service = IngestionService(adapter=FakeVkApiClient(), repository=repository, tasks_client=tasks_client)

    result = await service.execute(task_run(group_ids=[1, 2]), correlation_id="corr-1")

    assert result.stats() == {"groups": 2, "posts": 2, "comments": 2, "authors": 4}
    assert [group["id"] for group in repository.groups] == [1, 2]
    assert len(repository.posts) == 2
    assert len(repository.comments) == 2
    assert tasks_client.calls[-1] == ("complete", 10, "run-10", 6, 6, result.stats())


@pytest.mark.anyio
async def test_scope_all_uses_default_group_source():
    repository = FakeRepository()
    tasks_client = FakeTasksClient()
    service = IngestionService(adapter=FakeVkApiClient(), repository=repository, tasks_client=tasks_client)

    result = await service.execute(task_run(scope="all", group_ids=[]))

    assert result.groups == 1
    assert [group["id"] for group in repository.groups] == [1]


@pytest.mark.anyio
async def test_scope_all_without_configured_group_source_fails_task():
    repository = FakeRepository()
    tasks_client = FakeTasksClient()
    service = IngestionService(
        adapter=FakeVkApiClient(),
        repository=repository,
        tasks_client=tasks_client,
        default_group_ids=[],
    )

    with pytest.raises(RuntimeError, match="No group source configured for scope=all"):
        await service.execute(task_run(scope="all", group_ids=[]))

    assert tasks_client.calls == [("fail", 10, "run-10", "No group source configured for scope=all", 0, 0, {})]


@pytest.mark.anyio
async def test_real_vk_adapter_requires_token_without_leaking_secret():
    client = VkApiClient(token="")

    with pytest.raises(VkApiConfigurationError, match="VK token is not configured"):
        await client.get_groups([1])
