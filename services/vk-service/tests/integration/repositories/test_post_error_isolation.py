import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
import sqlalchemy.exc

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from _service_path import use_service_path

use_service_path()

from test_ingestion import FakeRepository, FakeTasksClient

from app.domain.exceptions.vk_api import VkApiInfrastructureError
from app.infrastructure.db.repositories.checkpoint import SqlAlchemyIngestionCheckpointStore
from app.infrastructure.db.session import SessionLocal
from app.services.ingestion.collector import DataCollector


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
        return {"items": [{"id": post_id * 10, "from_id": 1, "text": "comment"}]}

    async def iter_comment_pages(self, owner_id: int, post_id: int, start_offset: int = 0, page_size: int = 100):
        if post_id in self._fail_post_ids:
            raise VkApiInfrastructureError(10, f"Failed post {post_id}")
        yield {
            "items": [{"id": post_id * 10, "from_id": 1, "text": "comment"}],
            "profiles": [],
            "groups": [],
        }
        yield {"items": [], "profiles": [], "groups": []}

    async def get_users(self, user_ids: list, fields: list[str] | None = None) -> list:
        return [{"id": uid, "first_name": "Test"} for uid in user_ids]


def task_run(group_ids=None):
    return SimpleNamespace(
        task_id=10,
        run_id="run-10",
        scope="selected",
        mode="recent_posts",
        group_ids=group_ids if group_ids is not None else [1],
        post_limit=3,
        processed_items=0,
        total_items=0,
        status="running",
    )


@pytest.mark.anyio
async def test_three_posts_middle_fails(db_session):
    adapter = ControllableStubVkApiClient(fail_post_ids={2})
    repository = FakeRepository()
    tasks_client = FakeTasksClient()
    checkpoint_store = SqlAlchemyIngestionCheckpointStore(db_session)
    collector = DataCollector(
        adapter=adapter,
        repository=repository,
        tasks_client=tasks_client,
        checkpoint_store=checkpoint_store,
    )

    run = task_run(group_ids=[1])
    result = await collector.collect(run, [1])

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

    assert completed is not None
    assert completed.status == "completed"
    assert failed is not None
    assert failed.status == "failed"
    assert completed_third is not None
    assert completed_third.status == "completed"


@pytest.mark.anyio
async def test_task_level_failure_only_on_systemic():
    class FailingRepository(FakeRepository):
        async def get_active_group_ids(self):
            raise sqlalchemy.exc.DBAPIError("", None, None)

    adapter = ControllableStubVkApiClient()
    repository = FailingRepository()
    tasks_client = FakeTasksClient()
    collector = DataCollector(
        adapter=adapter,
        repository=repository,
        tasks_client=tasks_client,
    )

    run = SimpleNamespace(
        task_id=10,
        run_id="run-10",
        scope="all",
        mode="recent_posts",
        group_ids=[],
        post_limit=1,
        processed_items=0,
        total_items=0,
        status="running",
    )

    with pytest.raises(sqlalchemy.exc.DBAPIError):
        await collector.get_group_ids(run)


@pytest.mark.anyio
async def test_result_stats_error_count():
    adapter = ControllableStubVkApiClient(fail_post_ids={2})
    repository = FakeRepository()
    tasks_client = FakeTasksClient()
    collector = DataCollector(
        adapter=adapter,
        repository=repository,
        tasks_client=tasks_client,
    )

    run = task_run(group_ids=[1])
    result = await collector.collect(run, [1])

    stats = result.stats()
    assert stats["posts"] == 3
    assert stats["comments"] == 2
    assert stats["errors"] == 1


@pytest.mark.anyio
async def test_task_run_status_not_mutated():
    adapter = ControllableStubVkApiClient(fail_post_ids={2})
    repository = FakeRepository()
    tasks_client = FakeTasksClient()
    collector = DataCollector(
        adapter=adapter,
        repository=repository,
        tasks_client=tasks_client,
    )

    run = task_run(group_ids=[1])
    run.status = "running"
    await collector.collect(run, [1])

    assert run.status == "running"


@pytest.mark.anyio
async def test_checkpoint_completed_for_successful_failed_for_failed(db_session):
    adapter = ControllableStubVkApiClient(fail_post_ids={2})
    repository = FakeRepository()
    tasks_client = FakeTasksClient()
    checkpoint_store = SqlAlchemyIngestionCheckpointStore(db_session)
    collector = DataCollector(
        adapter=adapter,
        repository=repository,
        tasks_client=tasks_client,
        checkpoint_store=checkpoint_store,
    )

    run = task_run(group_ids=[1])
    await collector.collect(run, [1])
    await db_session.commit()

    async with SessionLocal() as new_session:
        new_store = SqlAlchemyIngestionCheckpointStore(new_session)
        first = await new_store.load("run-10", -1, 1)
        second = await new_store.load("run-10", -1, 2)
        third = await new_store.load("run-10", -1, 3)

    assert first is not None and first.status == "completed"
    assert second is not None and second.status == "failed"
    assert third is not None and third.status == "completed"
