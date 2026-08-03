from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import httpx
import pytest
from common.events import TaskEvent

from app.services.task_events_service import TaskEventsService


class FakeRepository:
    def __init__(self):
        self.processed = set()
        self.executions = []
        self.session = AsyncMock()
        begin_ctx = AsyncMock()
        begin_ctx.__aenter__.return_value = None
        begin_ctx.__aexit__.return_value = None
        self.session.begin = MagicMock(return_value=begin_ctx)

    async def is_processed(self, consumer_name, event_id):
        return (consumer_name, event_id) in self.processed

    async def mark_processed(self, consumer_name, event_id, _event_type):
        self.processed.add((consumer_name, event_id))

    async def get_execution(self, task_id, run_id):
        return next(
            (
                item
                for item in self.executions
                if item.task_id == task_id and item.run_id == run_id
            ),
            None,
        )

    async def get_active_execution(self, task_id):
        return next(
            (
                item
                for item in reversed(self.executions)
                if item.task_id == task_id and item.status in {"pending", "running"}
            ),
            None,
        )

    async def get_latest_execution(self, task_id):
        return next(
            (item for item in reversed(self.executions) if item.task_id == task_id),
            None,
        )

    async def create_execution(self, **kwargs):
        execution = SimpleNamespace(
            id=uuid4(),
            status="pending",
            is_terminal=False,
            cancellation_requested_at=None,
            cancellation_reason=None,
            **kwargs,
        )
        self.executions.append(execution)
        return execution

    async def request_cancellation(self, *, task_id, run_id, reason):
        execution = next(
            (
                item
                for item in reversed(self.executions)
                if item.task_id == task_id
                and item.status in {"pending", "running"}
                and (run_id is None or item.run_id == run_id)
            ),
            None,
        )
        if execution is None:
            return None
        execution.cancellation_requested_at = object()
        execution.cancellation_reason = reason
        if execution.status == "pending":
            execution.status = "cancelled"
            execution.is_terminal = True
        return execution

    async def fail_pending(self, execution_id, error):
        execution = next(item for item in self.executions if item.id == execution_id)
        execution.status = "failed"
        execution.is_terminal = True
        execution.last_error = error
        return True


class FakeTasksClient:
    def __init__(self):
        self.calls = []
        self.error = None

    async def start_execution(self, task_id, run_id, **kwargs):
        self.calls.append((task_id, run_id, kwargs))
        if self.error is not None:
            raise self.error
        return {"status": "running"}


def event(
    event_type="task.created",
    task_id=1,
    event_id=None,
    *,
    correlation_id="corr-1",
    run_id=None,
):
    payload = {
        "taskId": str(task_id),
        "ownerUserId": "user-1",
        "scope": "selected",
        "mode": "recent_posts",
        "groupIds": [1],
        "postLimit": 10,
    }
    if run_id:
        payload["runId"] = run_id
    return TaskEvent.model_validate(
        {
            "event_id": str(event_id or uuid4()),
            "event_type": event_type,
            "event_version": 1,
            "aggregate_id": str(task_id),
            "correlation_id": correlation_id,
            "payload": payload,
        }
    )


@pytest.mark.anyio
async def test_created_event_creates_immutable_execution_and_starts_task():
    repository = FakeRepository()
    client = FakeTasksClient()
    task_event = event(run_id="run-1")

    result = await TaskEventsService(repository, client).handle(task_event)

    assert result.status == "pending"
    assert result.plan_snapshot["groupIds"] == [1]
    assert client.calls[0][0:2] == (1, "run-1")


@pytest.mark.anyio
async def test_duplicate_event_does_not_create_or_start_twice():
    repository = FakeRepository()
    client = FakeTasksClient()
    task_event = event(run_id="run-1")
    service = TaskEventsService(repository, client)

    await service.handle(task_event)
    assert await service.handle(task_event) is None

    assert len(repository.executions) == 1
    assert len(client.calls) == 1


@pytest.mark.anyio
async def test_terminal_execution_is_not_reopened_and_resume_creates_child():
    repository = FakeRepository()
    terminal = await repository.create_execution(
        task_id=1,
        owner_user_id="user-1",
        run_id="old-run",
        scope="selected",
        mode="recent_posts",
        group_ids=[1],
        post_limit=10,
        plan_snapshot={},
        parent_execution_id=None,
    )
    terminal.status = "failed"
    terminal.is_terminal = True
    client = FakeTasksClient()

    result = await TaskEventsService(repository, client).handle(
        event(event_type="task.resumed", run_id="new-run")
    )

    assert terminal.status == "failed"
    assert result.run_id == "new-run"
    assert result.parent_execution_id == terminal.id


@pytest.mark.anyio
async def test_new_run_is_ignored_while_an_execution_is_active():
    repository = FakeRepository()
    await repository.create_execution(
        task_id=1,
        owner_user_id="user-1",
        run_id="active-run",
        scope="selected",
        mode="recent_posts",
        group_ids=[1],
        post_limit=10,
        plan_snapshot={},
        parent_execution_id=None,
    )
    client = FakeTasksClient()

    result = await TaskEventsService(repository, client).handle(
        event(run_id="other-run")
    )

    assert result is None
    assert client.calls == []


@pytest.mark.anyio
async def test_pending_cancellation_is_durable_and_idempotent():
    repository = FakeRepository()
    execution = await repository.create_execution(
        task_id=1,
        owner_user_id="user-1",
        run_id="run-1",
        scope="selected",
        mode="recent_posts",
        group_ids=[1],
        post_limit=10,
        plan_snapshot={},
        parent_execution_id=None,
    )
    service = TaskEventsService(repository, FakeTasksClient())

    first = await service.handle(event(event_type="task.cancelled", run_id="run-1"))
    second = await service.handle(event(event_type="task.cancelled", run_id="run-1"))

    assert first.status == "cancelled"
    assert execution.cancellation_reason == "task.cancelled"
    assert second is None


@pytest.mark.anyio
async def test_running_cancellation_requests_cooperative_stop():
    repository = FakeRepository()
    execution = await repository.create_execution(
        task_id=1,
        owner_user_id="user-1",
        run_id="run-1",
        scope="selected",
        mode="recent_posts",
        group_ids=[1],
        post_limit=10,
        plan_snapshot={},
        parent_execution_id=None,
    )
    execution.status = "running"

    result = await TaskEventsService(repository, FakeTasksClient()).handle(
        event(event_type="task.deleted", run_id="run-1")
    )

    assert result.status == "running"
    assert result.cancellation_requested_at is not None


@pytest.mark.anyio
async def test_409_marks_unclaimed_execution_terminal_failed():
    repository = FakeRepository()
    client = FakeTasksClient()
    response = httpx.Response(
        status_code=409,
        json={"detail": "already running"},
        request=httpx.Request("POST", "http://tasks"),
    )
    client.error = httpx.HTTPStatusError(
        "conflict",
        request=response.request,
        response=response,
    )

    result = await TaskEventsService(repository, client).handle(event(run_id="run-1"))

    assert result is None
    assert repository.executions[0].status == "failed"
    assert "already running" in repository.executions[0].last_error


@pytest.mark.anyio
async def test_transient_http_error_leaves_execution_pending():
    repository = FakeRepository()
    client = FakeTasksClient()
    response = httpx.Response(
        status_code=503,
        request=httpx.Request("POST", "http://tasks"),
    )
    client.error = httpx.HTTPStatusError(
        "unavailable",
        request=response.request,
        response=response,
    )
    task_event = event(run_id="run-1")

    with pytest.raises(httpx.HTTPStatusError):
        await TaskEventsService(repository, client).handle(task_event)

    assert repository.executions[0].status == "pending"
    assert ("vk-service", task_event.event_id) in repository.processed
