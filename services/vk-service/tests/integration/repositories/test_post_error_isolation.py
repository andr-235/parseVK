import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from _service_path import use_service_path

use_service_path()

from app.domain.exceptions.vk_api import VkApiInfrastructureError
from app.infrastructure.db.repositories.checkpoint import SqlAlchemyIngestionCheckpointStore
from app.infrastructure.db.session import SessionLocal
from app.services.ingestion.collector import DataCollector


class FakeRepository:
    def __init__(self):
        self.groups = {}
        self.authors = {}
        self.posts = {}
        self.comments = {}

    async def get_active_group_ids(self):
        return list(self.groups)

    async def upsert_group(self, payload, **_kwargs):
        self.groups[int(payload["id"])] = dict(payload)

    async def upsert_author(self, payload):
        self.authors[int(payload["vk_author_id"])] = dict(payload)

    async def upsert_post(self, payload, *, task_id, group_id):
        key = (int(payload["owner_id"]), int(payload["id"]))
        self.posts[key] = {**payload, "task_id": task_id, "group_id": group_id}

    async def upsert_comment(self, payload, *, task_id):
        key = (
            int(payload["owner_id"]),
            int(payload["post_id"]),
            int(payload["id"]),
        )
        self.comments[key] = {**payload, "task_id": task_id}

    async def count_comments_for_post(self, owner_id, post_id):
        return sum(
            1
            for comment_owner_id, comment_post_id, _ in self.comments
            if comment_owner_id == owner_id and comment_post_id == post_id
        )


class FakeTasksClient:
    pass


class ControllableStubVkApiClient:
    """Stub that can raise errors for specific posts."""

    token = ""

    def __init__(self, fail_post_ids: set[int] | None = None):
        self._fail_post_ids = set(fail_post_ids or [])

    async def get_groups(self, group_ids: list, fields: list[str] | None = None) -> list:
        return [{"id": gid, "name": f"Group {gid}"} for gid in group_ids]

    async def get_posts(self, group_id: int, *, mode: str, post_limit: int) -> dict:
        return {
            "items": [
                {"id": 1, "owner_id": -group_id, "from_id": -group_id, "text": "post1"},
                {"id": 2, "owner_id": -group_id, "from_id": -group_id, "text": "post2"},
                {"id": 3, "owner_id": -group_id, "from_id": -group_id, "text": "post3"},
            ]
        }

    async def get_comments(self, owner_id: int, post_id: int) -> dict:
        if post_id in self._fail_post_ids:
            raise VkApiInfrastructureError(10, f"Failed post {post_id}")
        return {
            "items": [
                {
                    "id": post_id * 10,
                    "owner_id": owner_id,
                    "post_id": post_id,
                    "from_id": 1,
                    "text": "comment",
                }
            ]
        }

    async def iter_comment_pages(
        self,
        owner_id: int,
        post_id: int,
        start_offset: int = 0,
        page_size: int = 100,
    ):
        if post_id in self._fail_post_ids:
            raise VkApiInfrastructureError(10, f"Failed post {post_id}")
        yield {
            "items": [
                {
                    "id": post_id * 10,
                    "owner_id": owner_id,
                    "post_id": post_id,
                    "from_id": 1,
                    "text": "comment",
                }
            ],
            "profiles": [],
            "groups": [],
        }
        yield {"items": [], "profiles": [], "groups": []}

    async def get_users(self, user_ids: list, fields: list[str] | None = None) -> list:
        return [{"id": uid, "first_name": "Test"} for uid in user_ids]


def execution(group_ids=None):
    group_id = (group_ids if group_ids is not None else [1])[0]
    return SimpleNamespace(
        task_id=10,
        run_id="run-10",
        post_limit=3,
        plan_snapshot={"source": {"externalId": str(group_id)}},
        processed_items=0,
        total_items=0,
        status="running",
    )


@pytest.mark.anyio
async def test_three_posts_middle_fails(db_session):
    adapter = ControllableStubVkApiClient(fail_post_ids={2})
    repository = FakeRepository()
    checkpoint_store = SqlAlchemyIngestionCheckpointStore(db_session)
    collector = DataCollector(
        adapter=adapter,
        repository=repository,
        tasks_client=FakeTasksClient(),
        checkpoint_store=checkpoint_store,
    )

    result = await collector.collect(execution(group_ids=[1]), [1])

    assert result.posts == 3
    assert result.comments == 2
    assert len(result.errors) == 1
    assert result.errors[0]["post_id"] == 2

    await db_session.commit()

    async with SessionLocal() as new_session:
        new_store = SqlAlchemyIngestionCheckpointStore(new_session)
        completed = await new_store.load("run-10", -1, 1)
        failed = await new_store.load("run-10", -1, 2)
        completed_third = await new_store.load("run-10", -1, 3)

    assert completed is not None and completed.status == "completed"
    assert failed is not None and failed.status == "failed"
    assert completed_third is not None and completed_third.status == "completed"


@pytest.mark.anyio
async def test_source_resolution_uses_frozen_plan_without_repository_read():
    class FailingRepository(FakeRepository):
        async def get_active_group_ids(self):
            raise AssertionError("mutable group lookup must not be used")

    collector = DataCollector(
        adapter=ControllableStubVkApiClient(),
        repository=FailingRepository(),
        tasks_client=FakeTasksClient(),
    )

    assert await collector.get_group_ids(execution(group_ids=[12345])) == [12345]


@pytest.mark.anyio
async def test_result_stats_error_count():
    collector = DataCollector(
        adapter=ControllableStubVkApiClient(fail_post_ids={2}),
        repository=FakeRepository(),
        tasks_client=FakeTasksClient(),
    )

    stats = (await collector.collect(execution(group_ids=[1]), [1])).stats()

    assert stats["posts"] == 3
    assert stats["comments"] == 2
    assert stats["errors"] == 1


@pytest.mark.anyio
async def test_execution_status_not_mutated_by_collector():
    collector = DataCollector(
        adapter=ControllableStubVkApiClient(fail_post_ids={2}),
        repository=FakeRepository(),
        tasks_client=FakeTasksClient(),
    )
    current = execution(group_ids=[1])

    await collector.collect(current, [1])

    assert current.status == "running"


@pytest.mark.anyio
async def test_checkpoint_completed_for_successful_failed_for_failed(db_session):
    checkpoint_store = SqlAlchemyIngestionCheckpointStore(db_session)
    collector = DataCollector(
        adapter=ControllableStubVkApiClient(fail_post_ids={2}),
        repository=FakeRepository(),
        tasks_client=FakeTasksClient(),
        checkpoint_store=checkpoint_store,
    )

    await collector.collect(execution(group_ids=[1]), [1])
    await db_session.commit()

    async with SessionLocal() as new_session:
        new_store = SqlAlchemyIngestionCheckpointStore(new_session)
        first = await new_store.load("run-10", -1, 1)
        second = await new_store.load("run-10", -1, 2)
        third = await new_store.load("run-10", -1, 3)

    assert first is not None and first.status == "completed"
    assert second is not None and second.status == "failed"
    assert third is not None and third.status == "completed"
