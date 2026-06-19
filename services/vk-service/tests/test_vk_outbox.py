import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.services.domain_events_service import OutboxService
from app.services.ingestion_service import IngestionService
from app.tasks.outbox_worker import kafka_key_for_event


class StubVkApiClient:
    """Minimal in-test stub replacing the deleted FakeVkApiClient."""

    token = ""

    async def get_groups(self, group_ids: list, fields: list[str] | None = None) -> list:
        return [{"id": gid, "name": f"Group {gid}"} for gid in group_ids]

    async def get_posts(self, group_id: int, *, mode: str, post_limit: int) -> dict:
        return {"items": [{"id": group_id * 10, "owner_id": -group_id, "from_id": -group_id, "text": "post"}]}

    async def get_comments(self, owner_id: int, post_id: int) -> dict:
        return {"items": [{"id": post_id * 10, "owner_id": owner_id, "post_id": post_id, "from_id": 1, "text": "comment"}]}


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeOutboxRepository:
    def __init__(self):
        self.events = []

    async def add_event(self, **kwargs):
        self.events.append(kwargs)


class FakeIngestionRepository:
    async def upsert_group(self, group):
        return None

    async def upsert_author(self, author):
        return None

    async def upsert_post(self, post, *, task_id, group_id=None):
        return None

    async def upsert_comment(self, comment, *, task_id):
        return None


class FakeTasksClient:
    async def update_progress(self, *args, **kwargs):
        return {"status": "running"}

    async def complete_execution(self, *args, **kwargs):
        return {"status": "done"}

    async def fail_execution(self, *args, **kwargs):
        return {"status": "failed"}


def task_run():
    return SimpleNamespace(
        task_id=10,
        run_id="run-10",
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
    await service.emit_comment_collected({"owner_id": -1, "post_id": 2, "id": 3}, task_id=10)
    await service.emit_task_completed(task_id=10, run_id="run-10", stats={})

    assert [event.get("dedupe_key") for event in repository.events] == [
        None,
        "vk.post_collected:-1:2",
        "vk.comment_collected:-1:2:3",
        "vk.task_completed:10:run-10",
    ]


def test_kafka_key_for_task_events_uses_task_id():
    assert kafka_key_for_event("vk.task_completed", {"taskId": 10}, "ignored") == "10"
    assert kafka_key_for_event("vk.post_collected", {"taskId": 10}, "-1:2") == "-1:2"


@pytest.mark.anyio
async def test_ingestion_emits_collected_events_through_outbox():
    outbox_repository = FakeOutboxRepository()
    service = IngestionService(
        adapter=StubVkApiClient(),
        repository=FakeIngestionRepository(),
        tasks_client=FakeTasksClient(),
        outbox_service=OutboxService(outbox_repository),
    )

    await service.execute(task_run(), correlation_id="corr-1")

    event_types = [event["event_type"] for event in outbox_repository.events]
    assert event_types == [
        "vk.group_collected",
        "vk.author_collected",
        "vk.post_collected",
        "vk.author_collected",
        "vk.comment_collected",
        "vk.task_progress_updated",
        "vk.task_completed",
    ]
