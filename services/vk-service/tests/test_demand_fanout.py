from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.services.demand_fanout import DemandLifecycleFanout


class CollectionRepositoryStub:
    def __init__(self, has_collection: bool):
        self.has_shared_collection = has_collection

    async def list_active_demands(self, execution_id):
        return []

    async def has_collection(self, execution_id):
        return self.has_shared_collection


class OutboxStub:
    def __init__(self):
        self.repository = SimpleNamespace(add_event=AsyncMock())


def build_fanout(has_collection: bool):
    client = SimpleNamespace(
        complete_execution=AsyncMock(),
        fail_execution=AsyncMock(),
    )
    outbox = OutboxStub()
    service = DemandLifecycleFanout(
        session=SimpleNamespace(execute=AsyncMock()),
        collection_repository=CollectionRepositoryStub(has_collection),
        tasks_client=client,
        outbox=outbox,
    )
    return service, client, outbox


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
