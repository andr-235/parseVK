from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.db.models import Task, TaskAuditLog, TaskAutomationSettings
from app.modules.automation.service import AutomationService


class FakeAutomationRepository:
    def __init__(self, scope="selected", group_ids=None, post_limit=10):
        self.settings = TaskAutomationSettings(
            owner_user_id="user-1",
            enabled=True,
            run_hour=9,
            run_minute=0,
            post_limit=post_limit,
            timezone_offset_minutes=0,
        )
        self.scope = scope
        self.group_ids = [1, 2] if group_ids is None else group_ids
        self.post_limit = post_limit

    async def lock_settings(self, _owner_user_id):
        return self.settings

    async def has_active_automation_task(self, _owner_user_id):
        return False

    async def find_latest_completed_reusable_task(self, owner_user_id):
        task = Task(
            owner_user_id=owner_user_id,
            title="VK parse",
            description={},
            status="done",
            scope=self.scope,
            mode="recent_posts",
            group_ids=self.group_ids,
            post_limit=self.post_limit,
            source="manual",
        )
        task.id = 100
        return task

    async def update_last_run_at(self, settings):
        settings.last_run_at = datetime.now(UTC)


class FakeTasksRepository:
    def __init__(self):
        self.tasks = []
        self.audits = []

    async def create_task(self, task: Task) -> Task:
        task.id = len(self.tasks) + 1
        task.created_at = datetime.now(UTC)
        task.updated_at = datetime.now(UTC)
        self.tasks.append(task)
        return task

    async def add_audit(self, audit: TaskAuditLog) -> TaskAuditLog:
        self.audits.append(audit)
        return audit


async def fake_freeze(_session, task):
    return {
        "taskRunId": task.execution_run_id,
        "sourceSetRevision": 3,
        "snapshotSha256": "a" * 64,
    }


def make_service(scope="selected", group_ids=None, post_limit=10):
    repository = FakeAutomationRepository(scope, group_ids, post_limit)
    tasks = FakeTasksRepository()
    outbox = SimpleNamespace(add_event=AsyncMock())
    resolver = SimpleNamespace(resolve=AsyncMock())
    command_publisher = AsyncMock()
    service = AutomationService(
        session=AsyncMock(),
        repository=repository,
        tasks=tasks,
        outbox=outbox,
        source_resolver_factory=lambda _session: resolver,
        freezer=fake_freeze,
        command_publisher=command_publisher,
    )
    service._clone_task_sources = AsyncMock()
    return service, tasks, outbox, resolver


@pytest.mark.anyio
async def test_automation_task_has_execution_run_id():
    service, tasks, _, _ = make_service()
    result = await service.run("user-1")
    assert result["started"] is True
    assert tasks.tasks[0].execution_run_id
    service.command_publisher.assert_awaited_once()


@pytest.mark.anyio
async def test_automation_event_contains_frozen_run_metadata():
    service, tasks, outbox, _ = make_service()
    await service.run("user-1")
    event = outbox.add_event.await_args.kwargs
    task = tasks.tasks[0]
    assert event["event_type"] == "task.automation_run_requested"
    assert event["payload"]["ownerUserId"] == "user-1"
    assert event["payload"]["taskRunId"] == task.execution_run_id
    assert event["payload"]["sourceSetRevision"] == 3
    assert event["payload"]["snapshotSha256"] == "a" * 64


@pytest.mark.anyio
async def test_selected_automation_clones_frozen_base_sources():
    service, tasks, _, resolver = make_service(group_ids=[1, 2])
    await service.run("user-1")
    base_task, group_ids = resolver.resolve.await_args.args
    assert base_task.id == 100
    assert group_ids == [1, 2]
    service._clone_task_sources.assert_awaited_once()
    assert tasks.tasks[0].group_ids == [1, 2]


@pytest.mark.anyio
async def test_scope_all_resolves_current_sources_on_new_task():
    service, tasks, _, resolver = make_service("all", [], 25)
    await service.run("user-1")
    task = tasks.tasks[0]
    resolver.resolve.assert_awaited_once_with(task, [])
    service._clone_task_sources.assert_not_awaited()
    assert (task.scope, task.group_ids, task.post_limit) == ("all", [], 25)
