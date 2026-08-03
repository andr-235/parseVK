from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.services.demand_fanout import DemandLifecycleFanout
from app.services.ingestion.pipeline import IngestionFailedError, IngestionPipeline
from app.services.ingestion.result import IngestionResult


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


def build_fanout(has_collection: bool, demands=None, sequence_rows=None):
    rows = iter(sequence_rows or [])

    async def execute(*_args, **_kwargs):
        row = next(rows)
        return SimpleNamespace(one_or_none=lambda: row)

    session = SimpleNamespace(execute=AsyncMock(side_effect=execute))
    outbox = OutboxStub()
    service = DemandLifecycleFanout(
        session=session,
        collection_repository=CollectionRepositoryStub(
            has_collection,
            demands=demands,
        ),
        outbox=outbox,
    )
    return service, outbox, session


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
    service, outbox, _session = build_fanout(True)
    task_run = SimpleNamespace(
        execution_id=uuid4(),
        task_id=1,
        run_id="leader-run",
        owner_user_id="leader",
        execution_sequence=4,
    )

    await service.report_progress(
        task_run,
        processed_items=5,
        total_items=10,
        occurred_at="2026-08-03T00:00:00+00:00",
    )

    outbox.repository.add_event.assert_not_awaited()


@pytest.mark.anyio
async def test_direct_execution_keeps_single_task_progress_fallback():
    service, outbox, _session = build_fanout(False)
    task_run = SimpleNamespace(
        execution_id=uuid4(),
        task_id=2,
        run_id="direct-run",
        owner_user_id="owner-2",
        execution_sequence=1,
    )

    await service.report_progress(
        task_run,
        processed_items=3,
        total_items=3,
        occurred_at="2026-08-03T00:00:00+00:00",
    )

    outbox.repository.add_event.assert_awaited_once()
    call = outbox.repository.add_event.await_args.kwargs
    assert call["aggregate_id"] == "2"
    assert call["payload"]["executionSequence"] == 2


@pytest.mark.anyio
async def test_progress_is_fanned_out_with_independent_sequences():
    demands = [demand(10), demand(11)]
    service, outbox, session = build_fanout(
        True,
        demands=demands,
        sequence_rows=[(2,), (7,)],
    )

    await service.report_progress(
        SimpleNamespace(execution_id=uuid4()),
        processed_items=5,
        total_items=10,
        occurred_at="2026-08-03T00:00:00+00:00",
    )

    assert session.execute.await_count == 2
    assert outbox.repository.add_event.await_count == 2
    calls = [call.kwargs for call in outbox.repository.add_event.await_args_list]
    assert [call["aggregate_id"] for call in calls] == ["10", "11"]
    assert [call["payload"]["executionSequence"] for call in calls] == [2, 7]


@pytest.mark.anyio
async def test_collection_pipeline_does_not_emit_terminal_http_callback():
    result = IngestionResult(groups=1, comments=4)
    collector = SimpleNamespace(
        current_result=result,
        get_group_ids=AsyncMock(return_value=[1]),
        collect=AsyncMock(return_value=result),
    )
    tasks_client = SimpleNamespace(
        complete_execution=AsyncMock(),
        fail_execution=AsyncMock(),
    )
    pipeline = IngestionPipeline(
        collector=collector,
        tasks_client=tasks_client,
        demand_fanout=object(),
    )

    current = SimpleNamespace(task_id=20, run_id="run-20")
    assert await pipeline.execute(current) is result

    tasks_client.complete_execution.assert_not_awaited()
    tasks_client.fail_execution.assert_not_awaited()


@pytest.mark.anyio
async def test_collection_failure_waits_for_fenced_terminal_outbox():
    result = IngestionResult(groups=1, comments=2)
    collector = SimpleNamespace(
        current_result=result,
        get_group_ids=AsyncMock(return_value=[1]),
        collect=AsyncMock(side_effect=RuntimeError("physical failure")),
    )
    tasks_client = SimpleNamespace(
        complete_execution=AsyncMock(),
        fail_execution=AsyncMock(),
    )
    pipeline = IngestionPipeline(
        collector=collector,
        tasks_client=tasks_client,
        demand_fanout=object(),
    )

    with pytest.raises(IngestionFailedError, match="physical failure"):
        await pipeline.execute(SimpleNamespace(task_id=21, run_id="run-21"))

    tasks_client.complete_execution.assert_not_awaited()
    tasks_client.fail_execution.assert_not_awaited()
