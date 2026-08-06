from dataclasses import replace
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import pytest

from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.domain.repositories.ingestion_staging import (
    StagingPayloadConflictError,
    StagingPayloadIntegrityError,
)
from app.infrastructure.db.models.executions import VkExecution, VkExecutionAttempt
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.infrastructure.db.repositories.ingestion_staging import (
    SqlAlchemyIngestionStagingRepository,
)

pytestmark = pytest.mark.anyio


async def execution_with_attempts(db_session):
    now = datetime.now(UTC)
    execution = VkExecution(
        id=UUID("11111111-1111-1111-1111-111111111111"),
        task_id=1,
        owner_user_id="owner",
        run_id="run-1",
        status="running",
        plan_snapshot={"source": {"provider": "vk", "externalId": "42"}},
    )
    first = VkExecutionAttempt(
        id=UUID("22222222-2222-2222-2222-222222222222"),
        execution_id=execution.id,
        attempt_number=1,
        fencing_token=7,
        worker_id="worker-1",
        status="running",
        provider_account_key="account-1",
        credential_version="v1",
        lease_expires_at=now + timedelta(minutes=1),
        heartbeat_at=now,
    )
    second = VkExecutionAttempt(
        id=UUID("33333333-3333-3333-3333-333333333333"),
        execution_id=execution.id,
        attempt_number=2,
        fencing_token=8,
        worker_id="worker-2",
        status="failed",
        provider_account_key="account-1",
        credential_version="v1",
        lease_expires_at=now + timedelta(minutes=1),
        heartbeat_at=now,
    )
    db_session.add_all([execution, first, second])
    await db_session.flush()
    return execution, first, second


def make_batch(execution, attempt, *, payload=None) -> StagedIngestionBatch:
    return StagedIngestionBatch.create(
        execution_id=execution.id,
        attempt_id=attempt.id,
        fencing_token=attempt.fencing_token,
        source_kind="comments",
        owner_id=-42,
        post_id=99,
        page_offset=200,
        payload=payload or {"comments": [{"id": 1}], "next_offset": 300},
    )


async def test_stage_is_idempotent_across_execution_attempts(db_session) -> None:
    execution, first, second = await execution_with_attempts(db_session)
    repository = SqlAlchemyIngestionStagingRepository(db_session)

    original, created = await repository.stage(make_batch(execution, first))
    replay, replay_created = await repository.stage(make_batch(execution, second))

    assert created is True
    assert replay_created is False
    assert replay.batch_id == original.batch_id
    assert replay.staged_by_attempt_id == first.id
    assert replay.staged_by_fencing_token == first.fencing_token
    assert await repository.get(original.batch_id) == original


async def test_same_position_with_changed_payload_is_rejected(db_session) -> None:
    execution, first, second = await execution_with_attempts(db_session)
    repository = SqlAlchemyIngestionStagingRepository(db_session)
    await repository.stage(make_batch(execution, first))

    with pytest.raises(StagingPayloadConflictError, match="different provider payload"):
        await repository.stage(
            make_batch(
                execution,
                second,
                payload={"comments": [{"id": 2}], "next_offset": 300},
            )
        )


async def test_non_deterministic_batch_id_is_rejected_before_insert(db_session) -> None:
    execution, first, _ = await execution_with_attempts(db_session)
    repository = SqlAlchemyIngestionStagingRepository(db_session)
    batch = replace(make_batch(execution, first), batch_id=uuid4())

    with pytest.raises(StagingPayloadIntegrityError, match="source position"):
        await repository.stage(batch)
    assert await repository.get(batch.batch_id) is None


async def test_mutated_payload_is_rejected_before_insert(db_session) -> None:
    execution, first, _ = await execution_with_attempts(db_session)
    repository = SqlAlchemyIngestionStagingRepository(db_session)
    batch = make_batch(execution, first)
    batch.payload["comments"][0]["id"] = 999

    with pytest.raises(StagingPayloadIntegrityError, match="digest and byte count"):
        await repository.stage(batch)
    assert await repository.get(batch.batch_id) is None


async def test_corrupted_stored_payload_is_rejected_on_read(db_session) -> None:
    execution, first, _ = await execution_with_attempts(db_session)
    repository = SqlAlchemyIngestionStagingRepository(db_session)
    original, _ = await repository.stage(make_batch(execution, first))
    model = await db_session.get(VkIngestionStagingBatch, original.batch_id)
    assert model is not None
    model.payload = {"comments": [{"id": 999}], "next_offset": 300}
    await db_session.flush()

    with pytest.raises(StagingPayloadIntegrityError, match="digest and byte count"):
        await repository.get(original.batch_id)
