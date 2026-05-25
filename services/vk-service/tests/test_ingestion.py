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


class FakeVkApiNamespace:
    def __init__(self, calls):
        self.calls = calls
        self.groups = self
        self.wall = self

    def getById(self, **kwargs):
        self.calls.append(("groups.getById", kwargs))
        return {"groups": [{"id": 1, "name": "Group 1"}]}

    def get(self, **kwargs):
        self.calls.append(("wall.get", kwargs))
        return {"items": [{"id": 10, "owner_id": -1, "from_id": -1, "text": "post"}]}

    def getComments(self, **kwargs):
        self.calls.append(("wall.getComments", kwargs))
        return {"items": [{"id": 100, "owner_id": -1, "post_id": 10, "from_id": 1, "text": "comment"}]}


class FakeVkApiSession:
    def __init__(self, calls):
        self.calls = calls

    def get_api(self):
        return FakeVkApiNamespace(self.calls)


def fake_vk_session_factory(calls):
    def factory(**kwargs):
        calls.append(("VkApi", kwargs))
        return FakeVkApiSession(calls)

    return factory


async def run_inline(func, *args, **kwargs):
    return func(*args, **kwargs)


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

    run = task_run(scope="all", group_ids=[])
    run.status = "running"
    run.finished_at = None
    run.last_error = None

    await service.execute(run)

    assert run.status == "failed"
    assert run.finished_at is not None
    assert "No group source configured for scope=all" in run.last_error
    assert tasks_client.calls == [("fail", 10, "run-10", "No group source configured for scope=all", 0, 0, {})]


@pytest.mark.anyio
async def test_real_vk_adapter_requires_token_without_leaking_secret():
    client = VkApiClient(token="")

    with pytest.raises(VkApiConfigurationError, match="VK token is not configured"):
        await client.get_groups([1])


@pytest.mark.anyio
async def test_real_vk_adapter_uses_vk_api_library_session():
    calls = []
    client = VkApiClient(token="vk-token", vk_session_factory=fake_vk_session_factory(calls), call_runner=run_inline)

    groups = await client.get_groups([1])
    posts = await client.get_posts(1, mode="recent_posts", post_limit=1)
    comments = await client.get_comments(-1, 10)

    assert groups == [{"id": 1, "name": "Group 1"}]
    assert posts == [{"id": 10, "owner_id": -1, "from_id": -1, "text": "post"}]
    assert comments == [{"id": 100, "owner_id": -1, "post_id": 10, "from_id": 1, "text": "comment"}]
    assert calls == [
        ("VkApi", {"token": "vk-token", "api_version": "5.199"}),
        ("groups.getById", {"group_ids": "1"}),
        ("wall.get", {"owner_id": -1, "count": 1}),
        ("wall.getComments", {"owner_id": -1, "post_id": 10, "count": 100}),
    ]


def test_settings_validation_enforces_token_when_fake_disabled():
    from pydantic import ValidationError
    from app.core.config import Settings
    
    settings_fake = Settings(use_fake_vk_adapter=True, vk_token="")
    assert settings_fake.use_fake_vk_adapter is True
    
    with pytest.raises(ValidationError, match="VK_SERVICE_VK_TOKEN is required when VK_SERVICE_USE_FAKE_VK_ADAPTER is false"):
        Settings(use_fake_vk_adapter=False, vk_token="")
        
    settings_real = Settings(use_fake_vk_adapter=False, vk_token="real-token")
    assert settings_real.vk_token == "real-token"


@pytest.mark.anyio
async def test_ingestion_updates_task_run_fields_on_success():
    repository = FakeRepository()
    tasks_client = FakeTasksClient()
    service = IngestionService(adapter=FakeVkApiClient(), repository=repository, tasks_client=tasks_client)

    run = task_run()
    run.status = "running"
    run.finished_at = None

    await service.execute(run)

    assert run.status == "done"
    assert run.finished_at is not None
    assert run.processed_items == 3
    assert run.total_items == 3


@pytest.mark.anyio
async def test_ingestion_updates_task_run_fields_on_failure():
    repository = FakeRepository()
    tasks_client = FakeTasksClient()
    service = IngestionService(
        adapter=FakeVkApiClient(),
        repository=repository,
        tasks_client=tasks_client,
        default_group_ids=[],
    )

    run = task_run(scope="all", group_ids=[])
    run.status = "running"
    run.finished_at = None
    run.last_error = None

    await service.execute(run)

    assert run.status == "failed"
    assert run.finished_at is not None
    assert "No group source configured for scope=all" in run.last_error
    assert run.processed_items == 0


def test_vk_token_redaction():
    repository = FakeRepository()
    tasks_client = FakeTasksClient()
    
    class MockAdapter:
        token = "secret-token-123"
        
    service = IngestionService(adapter=MockAdapter(), repository=repository, tasks_client=tasks_client)

    err = "Failed with secret-token-123 in message"
    sanitized = service._sanitize_error(err)
    assert sanitized == "Failed with <redacted> in message"


