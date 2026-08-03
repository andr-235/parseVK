import sys
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.db.models import Task, TaskAuditLog, TaskAutomationSettings
from app.modules.automation.service import AutomationService


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeAutomationRepository:
    def __init__(
        self,
        *,
        base_scope="selected",
        base_group_ids=None,
        base_post_limit=10,
    ):
        self.settings = TaskAutomationSettings(
            owner_user_id="user-1",
            enabled=True,
            run_hour=9,
            run_minute=0,
            post_limit=base_post_limit,
            timezone_offset_minutes=0,
        )
        self.base_scope = base_scope
        self.base_group_ids = (
            base_group_ids if base_group_ids is not None else [1, 2]
        )
        self.base_post_limit = base_post_limit
        self.has_active = False
        self.last_run_updated = False

    async def lock_settings(
        self,
        owner_user_id: str,
    ) -> TaskAutomationSettings:
        return self.settings

    async def has_active_automation_task(
        self,
        owner_user_id: str,
    ) -> bool:
        return self.has_active

    async def find_latest_completed_reusable_task(
        self,
        owner_user_id: str,
    ) -> Task | None:
        task = Task(
            owner_user_id=owner_user_id,
            title=f"VK parse: {self.base_scope} / recent_posts",
            description={},
            status="done",
            scope=self.base_scope,
            mode="recent_posts",
            group_ids=self.base_group_ids,
            post_limit=self.base_post_limit,
            source="manual",
        )
        task.id = 100
        return task

    async def update_last_run_at(
        self,
        settings: TaskAutomationSettings,
    ) -> None:
        settings.last_run_at = datetime.now(UTC)
        self.last_run_updated = True


class FakeTasksRepository:
    def __init__(self):
        self._next_id = 1
        self.tasks = []
        self.audits = []

    async def create_task(self, task: Task) -> Task:
        task.id = self._next_id
        self._next_id += 1
        task.created_at = datetime.now(UTC)
        task.updated_at = datetime.now(UTC)
        self.tasks.append(task)
        return task

    async def add_audit(self, audit: TaskAuditLog) -> TaskAuditLog:
        audit.id = len(self.audits) + 1
        audit.created_at = datetime.now(UTC)
        self.audits.append(audit)
        return audit


class FakeOutbox:
    def __init__(self):
        self.events = []

    async def add_event(self, **kwargs) -> None:
        self.events.append(kwargs)


class FakeSourceAdapter:
    def __init__(self):
        self.ensure_normalized_sources = AsyncMock()


async def fake_freeze(session, task):
    return {
        "taskRunId": task.execution_run_id,
        "sourceSetRevision": 3,
        "snapshotSha256": "a" * 64,
    }


def make_service(
    *,
    base_scope="selected",
    base_group_ids=None,
    base_post_limit=10,
):
    session = MagicMock()
    repository = FakeAutomationRepository(
        base_scope=base_scope,
        base_group_ids=base_group_ids,
        base_post_limit=base_post_limit,
    )
    tasks = FakeTasksRepository()
    outbox = FakeOutbox()
    source_adapter = FakeSourceAdapter()
    command_publisher = AsyncMock()
    service = AutomationService(
        session=session,
        repository=repository,
        tasks=tasks,
        outbox=outbox,
        source_adapter_factory=lambda _session: source_adapter,
        freezer=fake_freeze,
        command_publisher=command_publisher,
    )
    service._clone_task_sources = AsyncMock()
    service.test_source_adapter = source_adapter
    return service, repository, tasks, outbox


@pytest.mark.anyio
async def test_automation_task_has_execution_run_id():
    service, _, tasks, _ = make_service()

    result = await service.run("user-1")

    assert result["started"] is True
    assert len(tasks.tasks) == 1
    task = tasks.tasks[0]
    assert task.execution_run_id is not None
    assert len(task.execution_run_id) > 0
    service.command_publisher.assert_awaited_once()


@pytest.mark.anyio
async def test_automation_event_contains_frozen_run_metadata():
    service, _, tasks, outbox = make_service()

    await service.run("user-1")

    assert len(outbox.events) == 1
    event = outbox.events[0]
    assert event["event_type"] == "task.automation_run_requested"
    task = tasks.tasks[0]
    payload = event["payload"]
    assert payload["taskId"] == str(task.id)
    assert payload["ownerUserId"] == "user-1"
    assert payload["runId"] == task.execution_run_id
    assert payload["taskRunId"] == task.execution_run_id
    assert payload["sourceSetRevision"] == 3
    assert payload["snapshotSha256"] == "a" * 64
    service.command_publisher.assert_awaited_once_with(
        service.session,
        service.outbox,
        task,
        {
            "taskRunId": task.execution_run_id,
            "sourceSetRevision": 3,
            "snapshotSha256": "a" * 64,
        },
    )


@pytest.mark.anyio
async def test_selected_automation_clones_frozen_base_sources():
    service, _, tasks, _ = make_service(
        base_scope="selected",
        base_group_ids=[1, 2],
    )

    await service.run("user-1")

    new_task = tasks.tasks[0]
    adapter_call = service.test_source_adapter.ensure_normalized_sources.await_args
    assert adapter_call.args[0].id == 100
    assert adapter_call.args[1] == [1, 2]
    service._clone_task_sources.assert_awaited_once()
    assert new_task.group_ids == [1, 2]


@pytest.mark.anyio
async def test_scope_all_resolves_current_sources_on_new_task():
    service, _, tasks, _ = make_service(
        base_scope="all",
        base_group_ids=[],
        base_post_limit=25,
    )

    await service.run("user-1")

    task = tasks.tasks[0]
    assert task.scope == "all"
    assert task.mode == "recent_posts"
    assert task.group_ids == []
    assert task.post_limit == 25
    assert task.source == "automation"
    service.test_source_adapter.ensure_normalized_sources.assert_awaited_once_with(
        task,
        [],
    )
    service._clone_task_sources.assert_not_awaited()
