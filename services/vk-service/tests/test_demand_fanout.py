from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import httpx
import pytest

from app.services.demand_fanout import DemandLifecycleFanout


class CollectionRepositoryStub:
    def __init__(self, has_collection: bool, demands=None):
        self.has_shared_collection = has_collection
        self.demands = list(demands or [])

    async def list_active_demands(self, execution_id):
        return list(self.demands)

    async def has_collection(self, execution_id):
        return self.has_shared_collection


class OutboxStub:
    def __init__(self):
        self.repository = SimpleNamespace(add_event=AsyncMock())


def build_fanout(has_collection: bool, demands=None):
    client = SimpleNamespace(
        complete_execution=AsyncMock(),
        fail_execution=AsyncMock(),
    )
    outbox = OutboxStub()
    service = DemandLifecycleFanout(
        session=SimpleNamespace(execute=AsyncMock()),
        collection_repository=CollectionRepositoryStub(
            has_collection,
            demands=demands,
        ),
        tasks_client=client,
        outbox=outbox,
    )
    return service, client, outbox


def demand(task_id: int):
    return SimpleNamespace(
        id=uuid4(),
        task_id=task_id,
        run_id=f"run-{task_id}",
        owner_user_id=f"owner-{task_id}",
        execution_sequence=1,
    )


@pytest.mark.anyio
async def test_shared_collection_without_active_demands_has_zero_fanout():
    service, client, outbox = build_fanout(True)
    task_run = SimpleNamespace(
        execution_id=uuid4(),
        task_id=1,
        run_id="leader-run",
        owner_user_id="leader",
        execution_sequence=4,
    )

    await service.complete_callbacks(
        task_run,
        processed_items=10,
        total_items=10,
        stats={},
        correlation_id="corr",
    )
    await service.report_progress(
        task_run,
        processed_items=5,
        total_items=10,
        occurred_at="2026-08-03T00:00:00+00:00",
    )

    client.complete_execution.assert_not_awaited()
    outbox.repository.add_event.assert_not_awaited()


@pytest.mark.anyio
async def test_direct_execution_keeps_single_task_fallback():
    service, client, outbox = build_fanout(False)
    task_run = SimpleNamespace(
        execution_id=uuid4(),
        task_id=2,
        run_id="direct-run",
        owner_user_id="owner-2",
        execution_sequence=1,
    )

    await service.complete_callbacks(
        task_run,
        processed_items=3,
        total_items=3,
        stats={"comments": 3},
        correlation_id="corr-2",
    )

    client.complete_execution.assert_awaited_once()
    assert client.complete_execution.await_args.args[:2] == (2, "direct-run")
    outbox.repository.add_event.assert_not_awaited()


@pytest.mark.anyio
async def test_complete_callback_failure_does_not_stop_other_demands():
    demands = [demand(10), demand(11)]
    service, client, _outbox = build_fanout(True, demands=demands)
    response = httpx.Response(
        status_code=503,
        request=httpx.Request("POST", "http://tasks/complete"),
    )
    client.complete_execution.side_effect = [
        httpx.HTTPStatusError(
            "unavailable",
            request=response.request,
            response=response,
        ),
        {"status": "done"},
    ]

    await service.complete_callbacks(
        SimpleNamespace(execution_id=uuid4()),
        processed_items=5,
        total_items=5,
        stats={},
        correlation_id="corr",
    )

    assert client.complete_execution.await_count == 2


@pytest.mark.anyio
async def test_fail_callback_failure_does_not_mask_physical_failure():
    demands = [demand(12), demand(13)]
    service, client, _outbox = build_fanout(True, demands=demands)
    client.fail_execution.side_effect = httpx.ConnectError(
        "offline",
        request=httpx.Request("POST", "http://tasks/fail"),
    )

    await service.fail_callbacks(
        SimpleNamespace(execution_id=uuid4()),
        error="physical failure",
        processed_items=2,
        total_items=5,
        stats={},
        correlation_id="corr",
    )

    assert client.fail_execution.await_count == 2
