import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.tasks import VkTaskRun
from app.infrastructure.db.repositories.outbox import SqlAlchemyOutboxRepository
from app.services.domain_events_service import OutboxService
from app.services.ingestion_service import IngestionService
from app.tasks.outbox_worker import kafka_key_for_event
from sqlalchemy import select


class StubVkApiClient:
    """Minimal in-test stub replacing the deleted FakeVkApiClient."""

    token = ""

    async def get_groups(self, group_ids: list, fields: list[str] | None = None) -> list:
        return [{"id": gid, "name": f"Group {gid}"} for gid in group_ids]

    async def get_posts(self, group_id: int, *, mode: str, post_limit: int) -> dict:
        return {
            "items": [
                {"id": group_id * 10, "owner_id": -group_id, "from_id": -group_id, "text": "post"}
            ]
        }

    async def get_comments(self, owner_id: int, post_id: int) -> dict:
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
        # Yield a page matching current mock behavior, then an empty terminator page.
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


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeOutboxRepository:
    def __init__(self):
        self.events = []

    async def add_event(self, **kwargs):
        self.events.append(kwargs)

    async def list_pending(self, *, limit=100):
        return []

    async def lock_pending_batch(self, limit=100):
        return []

    async def mark_published(self, event):
        pass

    async def mark_failed_or_retry(self, event_id, error):
        return False


class FakeIngestionRepository:
    async def upsert_group(self, group):
        return None

    async def upsert_author(self, author):
        return None

    async def upsert_post(self, post, *, task_id, group_id=None):
        return None

    async def upsert_comment(self, comment, *, task_id):
        return None

    async def count_comments_for_post(self, owner_id: int, post_id: int) -> int:
        return 0


class FakeTasksClient:
    async def complete_execution(self, *args, **kwargs):
        return {"status": "done"}

    async def fail_execution(self, *args, **kwargs):
        return {"status": "failed"}


def task_run():
    return SimpleNamespace(
        task_id=10,
        run_id="run-10",
        owner_user_id="user-1",
        scope="selected",
        mode="recent_posts",
        group_ids=[1],
        post_limit=1,
        processed_items=0,
        total_items=0,
    )


@pytest.mark.anyio
async def test_outbox_service_uses_deterministic_dedupe_keys():
    repository = FakeOutboxRepository()
    service = OutboxService(repository)

    await service.emit_group_collected({"id": 1})
    await service.emit_post_collected({"owner_id": -1, "id": 2}, task_id=10)
    await service.emit_task_completed(task_id=10, run_id="run-10", stats={})

    assert [event.get("dedupe_key") for event in repository.events] == [
        None,
        "vk.post_collected:-1:2",
        "vk.task_completed:10:run-10",
    ]


def test_kafka_key_for_task_events_uses_task_id():
    assert kafka_key_for_event("vk.task_completed", {"taskId": 10}, "ignored") == "10"
    assert kafka_key_for_event("vk.post_collected", {"taskId": 10}, "-1:2") == "-1:2"


@pytest.mark.anyio
async def test_ingestion_emits_collected_events_through_outbox(db_session):
    db_session.add(
        VkTaskRun(
            task_id=10,
            run_id="run-10",
            owner_user_id="user-1",
            scope="selected",
            mode="recent_posts",
            group_ids=[1],
            post_limit=1,
        )
    )
    await db_session.flush()

    outbox_repository = SqlAlchemyOutboxRepository(db_session)
    service = IngestionService(
        adapter=StubVkApiClient(),
        repository=FakeIngestionRepository(),
        tasks_client=FakeTasksClient(),
        outbox_service=OutboxService(outbox_repository, session=db_session),
    )

    await service.execute(task_run(), correlation_id="corr-1")

    result = await db_session.execute(select(OutboxEvent).order_by(OutboxEvent.created_at))
    event_types = [event.event_type for event in result.scalars().all()]
    assert event_types == [
        "vk.group_collected",
        "vk.post_collected",
        "vk.comments_collected",
        "task.execution_progressed",
        "vk.task_completed",
    ]
