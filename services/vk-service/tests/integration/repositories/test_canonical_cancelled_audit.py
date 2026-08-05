"""Audit invariants for cancelled demands in shared source executions."""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from _canonical_runtime_helpers import (
    attach,
    cancel_command,
    make_command,
    seed_account,
)
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkTaskRunBinding,
)
from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)
from app.infrastructure.db.repositories.canonical_executions import (
    CanonicalExecutionRepository,
)


@pytest.mark.anyio
async def test_shared_completion_does_not_rewrite_cancelled_demand_audit(db_session):
    await seed_account(db_session)
    source_id = uuid4()
    cancelled_command = make_command(task_id=2020, source_id=source_id)
    active_command = make_command(task_id=2021, source_id=source_id)
    cancelled_attachment = await attach(db_session, cancelled_command)
    active_attachment = await attach(db_session, active_command)
    executions = CanonicalExecutionRepository(db_session)
    claim = await executions.claim_next(
        worker_id="audit-worker",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )
    assert claim is not None

    await CanonicalVkCommandRepository(db_session).request_cancellation(
        cancel_command(cancelled_command)
    )
    assert await executions.complete(
        execution_id=claim.execution_id,
        attempt_id=claim.attempt_id,
        fencing_token=claim.fencing_token,
        processed_items=12,
        total_items=12,
        stats={"comments": 12},
    )

    cancelled_demand = await db_session.get(
        VkCollectionDemand,
        cancelled_attachment.attachments[0].demand.id,
    )
    active_demand = await db_session.get(
        VkCollectionDemand,
        active_attachment.attachments[0].demand.id,
    )
    cancelled_binding = await db_session.get(
        VkTaskRunBinding,
        cancelled_attachment.binding.id,
    )
    active_binding = await db_session.get(
        VkTaskRunBinding,
        active_attachment.binding.id,
    )
    assert cancelled_demand.status == "cancelled"
    assert cancelled_demand.processed_items == 0
    assert cancelled_demand.total_items == 0
    assert cancelled_demand.stats == {}
    assert active_demand.status == "done"
    assert active_demand.processed_items == 12
    assert cancelled_binding.status == "cancelled"
    assert active_binding.status == "done"
