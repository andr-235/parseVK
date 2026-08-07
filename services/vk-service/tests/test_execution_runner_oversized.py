from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import UUID

import pytest
from sqlalchemy import select

import app.infrastructure.db.session as session_module
from app.domain.entities.ingestion_part_identity import IngestionPartVersions
from app.infrastructure.db.models.ingestion_part_diagnostics import (
    VkIngestionOversizedDiagnostic,
)
from app.infrastructure.db.models.outbox import OutboxEvent
from app.services.ingestion.part_errors import OversizedIngestionItemError
from app.services.ingestion.pipeline import IngestionPipeline
from app.services.ingestion.result import IngestionResult
from app.tasks.execution_runner import ExecutionAttemptRunner

pytestmark = pytest.mark.anyio


class ActiveControl:
    async def ensure_active(self) -> None:
        return None

    async def ensure_active_in_session(self, _session) -> None:
        return None


class OversizedCollector:
    def __init__(self, session):
        self.session = session
        self.current_result = IngestionResult()

    async def get_group_ids(self, _claim):
        return [1]

    async def collect(self, _claim, _group_ids, *, correlation_id=None):
        self.session.add(
            OutboxEvent(
                id=UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                event_type="must.rollback",
                event_version=1,
                aggregate_type="test",
                aggregate_id="rollback",
                payload={"large": True},
            )
        )
        await self.session.flush()
        raise oversized_error()


def oversized_error() -> OversizedIngestionItemError:
    return OversizedIngestionItemError(
        batch_id=UUID("11111111-1111-1111-1111-111111111111"),
        item_kind="comment",
        item_identity="comment:99",
        wire_bytes_count=800_000,
        hard_limit_bytes=768 * 1024,
        versions=IngestionPartVersions(),
    )


def pipeline_factory(session, **_kwargs):
    return IngestionPipeline(
        collector=OversizedCollector(session),
        tasks_client=SimpleNamespace(
            complete_execution=AsyncMock(),
            fail_execution=AsyncMock(),
        ),
        demand_fanout=object(),
    )


async def test_runner_rolls_back_pipeline_effects_before_quarantine(db_session) -> None:
    runner = ExecutionAttemptRunner(
        execution_store=object(),
        session_factory=session_module.SessionLocal,
        ingestion_factory=pipeline_factory,
        lease_seconds=60,
        heartbeat_seconds=30,
        timeout_seconds=60,
        adapter_factory=lambda _session, _claim: object(),
    )
    claim = SimpleNamespace(task_id=10, run_id="run-1")

    with pytest.raises(OversizedIngestionItemError):
        await runner._run_ingestion(claim, ActiveControl())

    async with session_module.SessionLocal() as session:
        rolled_back = await session.get(
            OutboxEvent,
            UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        )
        diagnostics = (
            await session.scalars(select(VkIngestionOversizedDiagnostic))
        ).all()

    assert rolled_back is None
    assert len(diagnostics) == 1
    assert diagnostics[0].batch_id == UUID(
        "11111111-1111-1111-1111-111111111111"
    )
    assert diagnostics[0].status == "quarantined"
