from types import SimpleNamespace

import pytest

from app.services.ingestion.result import IngestionResult
from app.services.ingestion_service import IngestionService


class FakePipeline:
    def __init__(self, result=None, error=None):
        self.result = result or IngestionResult()
        self.error = error
        self.calls = []

    async def execute(self, execution, *, correlation_id=None):
        self.calls.append((execution, correlation_id))
        if self.error is not None:
            raise self.error
        return self.result


class FakeCollector:
    pass


class FakeAdapter:
    pass


class FakeRepository:
    pass


class FakeTasksClient:
    pass


def execution():
    return SimpleNamespace(
        task_id=10,
        run_id="run-10",
        owner_user_id="user-1",
        post_limit=10,
        plan_snapshot={"source": {"externalId": "1"}},
    )


@pytest.mark.anyio
async def test_ingestion_service_executes_immutable_execution_plan():
    expected = IngestionResult(groups=1, posts=2, comments=3)
    pipeline = FakePipeline(result=expected)
    service = IngestionService(
        adapter=FakeAdapter(),
        repository=FakeRepository(),
        tasks_client=FakeTasksClient(),
        collector=FakeCollector(),
        pipeline=pipeline,
    )
    current = execution()

    result = await service.execute(current, correlation_id="corr-1")

    assert result is expected
    assert pipeline.calls == [(current, "corr-1")]


@pytest.mark.anyio
async def test_ingestion_service_propagates_attempt_failure():
    pipeline = FakePipeline(error=RuntimeError("collection failed"))
    service = IngestionService(
        adapter=FakeAdapter(),
        repository=FakeRepository(),
        tasks_client=FakeTasksClient(),
        collector=FakeCollector(),
        pipeline=pipeline,
    )

    with pytest.raises(RuntimeError, match="collection failed"):
        await service.execute(execution(), correlation_id="corr-2")


def test_ingestion_error_redaction_hook_is_stable():
    service = IngestionService(
        adapter=FakeAdapter(),
        repository=FakeRepository(),
        tasks_client=FakeTasksClient(),
        collector=FakeCollector(),
        pipeline=FakePipeline(),
    )

    assert service._sanitize_error("ordinary error") == "ordinary error"
