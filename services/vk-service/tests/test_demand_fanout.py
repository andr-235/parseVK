from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest

import app.services.demand_fanout as fanout_module
from app.services.demand_fanout import DemandLifecycleFanout
from app.services.ingestion.pipeline import IngestionFailedError, IngestionPipeline
from app.services.ingestion.result import IngestionResult


@pytest.mark.anyio
async def test_progress_uses_only_canonical_binding_aggregation(monkeypatch):
    report = AsyncMock(return_value=2)
    observe = Mock()
    monkeypatch.setattr(fanout_module, "report_binding_progress", report)
    monkeypatch.setattr(fanout_module, "observe_collection_fanout", observe)
    session = object()
    execution_id = uuid4()
    service = DemandLifecycleFanout(session=session)

    await service.report_progress(
        SimpleNamespace(execution_id=execution_id),
        processed_items=5,
        total_items=10,
        occurred_at="2026-08-03T00:00:00+00:00",
    )

    report.assert_awaited_once_with(
        session,
        execution_id=execution_id,
        processed_items=5,
        total_items=10,
        stats={},
        occurred_at="2026-08-03T00:00:00+00:00",
    )
    observe.assert_called_once_with("progress", 2)


@pytest.mark.anyio
async def test_progress_without_execution_identity_is_ignored(monkeypatch):
    report = AsyncMock()
    monkeypatch.setattr(fanout_module, "report_binding_progress", report)
    service = DemandLifecycleFanout(session=object())

    await service.report_progress(
        SimpleNamespace(),
        processed_items=1,
        total_items=1,
        occurred_at="2026-08-03T00:00:00+00:00",
    )

    report.assert_not_awaited()


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
