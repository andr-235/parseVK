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
        self.collections = []
        self.demands = []
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

    async def attach_demand(self, **kwargs):
        if any(
            item.task_id == kwargs["task_id"] and item.run_id == kwargs["run_id"]
            for item in self.demands
        ):
            return None
        if any(
            item.task_id == kwargs["task_id"]
            and item.status in {"pending", "running"}
            for item in self.demands
        ):
            return None

        collection = next(
            (
                item
                for item in self.collections
                if item.provider_account_key == kwargs["provider_account_key"]
                and item.source_key == kwargs["source_key"]
                and item.fingerprint == kwargs["fingerprint"]
                and item.status in {"pending", "running"}
            ),
            None,
        )
        created = collection is None
        if created:
            execution = SimpleNamespace(
                id=uuid4(),
                task_id=kwargs["task_id"],
                owner_user_id=kwargs["owner_user_id"],
                run_id=kwargs["run_id"],
                status="pending",
                scope=kwargs["scope"],
                mode=kwargs["mode"],
                group_ids=kwargs["group_ids"],
                post_limit=kwargs["post_limit"],
                plan_snapshot=kwargs["plan_snapshot"],
                parent_execution_id=None,
                cancellation_requested_at=None,
                cancellation_reason=None,
            )
            collection = SimpleNamespace(
                id=uuid4(),
                execution_id=execution.id,
                provider_account_key=kwargs["provider_account_key"],
                source_key=kwargs["source_key"],
                fingerprint=kwargs["fingerprint"],
                status="pending",
            )
            self.executions.append(execution)
            self.collections.append(collection)
        else:
            execution = next(
                item for item in self.executions if item.id == collection.execution_id
            )

        demand = SimpleNamespace(
            id=uuid4(),
            collection_id=collection.id,
            task_id=kwargs["task_id"],
            run_id=kwargs["run_id"],
            owner_user_id=kwargs["owner_user_id"],
            status="running" if collection.status == "running" else "pending",
            cancellation_reason=None,
        )
        self.demands.append(demand)
        return SimpleNamespace(
            collection=collection,
            demand=demand,
            execution=execution,
            collection_created=created,
        )

    async def request_cancellation(self, *, task_id, run_id, reason):
        demand = next(
            (
                item
                for item in reversed(self.demands)
                if item.task_id == task_id
                and item.status in {"pending", "running"}
                and (run_id is None or item.run_id == run_id)
            ),
            None,
        )
        if demand is None:
            return None
        demand.status = "cancelled"
        demand.cancellation_reason = reason
        remaining = [
            item
            for item in self.demands
            if item.collection_id == demand.collection_id
            and item.status in {"pending", "running"}
        ]
        if not remaining:
            collection = next(
                item for item in self.collections if item.id == demand.collection_id
            )
            execution = next(
                item for item in self.executions if item.id == collection.execution_id
            )
            execution.cancellation_requested_at = object()
            execution.cancellation_reason = reason
            if execution.status == "pending":
                execution.status = "cancelled"
                collection.status = "cancelled"
        return demand

    async def fail_pending_demand(self, *, task_id, run_id, error):
        demand = next(
            item
            for item in self.demands
            if item.task_id == task_id and item.run_id == run_id
        )
        demand.status = "failed"
        demand.last_error = error
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
    group_ids=None,
    post_limit=10,
):
    payload = {
        "taskId": str(task_id),
        "ownerUserId": f"user-{task_id}",
        "scope": "selected",
        "mode": "recent_posts",
        "groupIds": group_ids or [1],
        "postLimit": post_limit,
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
async def test_created_event_creates_collection_demand_and_starts_task():
    repository = FakeRepository()
    client = FakeTasksClient()

    result = await TaskEventsService(repository, client).handle(
        event(run_id="run-1")
    )

    assert result.status == "pending"
    assert result.plan_snapshot["groupIds"] == [1]
    assert len(repository.collections) == 1
    assert len(repository.demands) == 1
    assert client.calls[0][0:2] == (1, "run-1")


@pytest.mark.anyio
async def test_exact_compatible_demands_share_one_collection():
    repository = FakeRepository()
    client = FakeTasksClient()
    service = TaskEventsService(repository, client)

    first = await service.handle(event(task_id=1, run_id="run-1"))
    second = await service.handle(event(task_id=2, run_id="run-2"))

    assert first.id == second.id
    assert len(repository.collections) == 1
    assert len(repository.executions) == 1
    assert len(repository.demands) == 2
    assert [call[:2] for call in client.calls] == [(1, "run-1"), (2, "run-2")]


@pytest.mark.anyio
async def test_fingerprint_mismatch_creates_separate_collection():
    repository = FakeRepository()
    service = TaskEventsService(repository, FakeTasksClient())

    first = await service.handle(event(task_id=1, run_id="run-1", post_limit=10))
    second = await service.handle(event(task_id=2, run_id="run-2", post_limit=20))

    assert first.id != second.id
    assert len(repository.collections) == 2


@pytest.mark.anyio
async def test_duplicate_event_does_not_attach_or_start_twice():
    repository = FakeRepository()
    client = FakeTasksClient()
    task_event = event(run_id="run-1")
    service = TaskEventsService(repository, client)

    await service.handle(task_event)
    assert await service.handle(task_event) is None

    assert len(repository.demands) == 1
    assert len(client.calls) == 1


@pytest.mark.anyio
async def test_new_run_is_ignored_while_task_has_active_demand():
    repository = FakeRepository()
    client = FakeTasksClient()
    service = TaskEventsService(repository, client)

    await service.handle(event(task_id=1, run_id="active-run"))
    result = await service.handle(event(task_id=1, run_id="other-run"))

    assert result is None
    assert len(repository.demands) == 1
    assert len(client.calls) == 1


@pytest.mark.anyio
async def test_cancelling_one_demand_keeps_shared_collection_running():
    repository = FakeRepository()
    service = TaskEventsService(repository, FakeTasksClient())
    await service.handle(event(task_id=1, run_id="run-1"))
    await service.handle(event(task_id=2, run_id="run-2"))
    repository.collections[0].status = "running"
    repository.executions[0].status = "running"
    repository.demands[0].status = "running"
    repository.demands[1].status = "running"

    cancelled = await service.handle(
        event(event_type="task.cancelled", task_id=1, run_id="run-1")
    )

    assert cancelled.status == "cancelled"
    assert repository.demands[1].status == "running"
    assert repository.executions[0].cancellation_requested_at is None


@pytest.mark.anyio
async def test_last_cancelled_demand_requests_collection_stop():
    repository = FakeRepository()
    service = TaskEventsService(repository, FakeTasksClient())
    await service.handle(event(task_id=1, run_id="run-1"))
    await service.handle(event(task_id=2, run_id="run-2"))
    repository.collections[0].status = "running"
    repository.executions[0].status = "running"
    repository.demands[0].status = "running"
    repository.demands[1].status = "running"

    await service.handle(
        event(event_type="task.cancelled", task_id=1, run_id="run-1")
    )
    await service.handle(
        event(event_type="task.cancelled", task_id=2, run_id="run-2")
    )

    assert repository.executions[0].cancellation_requested_at is not None


@pytest.mark.anyio
async def test_409_fails_only_rejected_demand():
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

    result = await TaskEventsService(repository, client).handle(
        event(run_id="run-1")
    )

    assert result is None
    assert repository.demands[0].status == "failed"
    assert "already running" in repository.demands[0].last_error


@pytest.mark.anyio
async def test_transient_http_error_leaves_demand_pending():
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

    assert repository.demands[0].status == "pending"
    assert ("vk-service", task_event.event_id) in repository.processed
