"""Outbox events emitted by canonical VK command handling."""

from datetime import UTC, datetime
from uuid import uuid4

from common.events.task_execution_failed import TaskExecutionFailedPayload
from common.events.task_execution_started import TaskExecutionStartedPayload
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.executions import VkExecutionAttempt
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.source_collections import VkTaskRunBinding

EXECUTOR = "vk-service"


def utcnow() -> datetime:
    return datetime.now(UTC)


def add_outbox(
    session: AsyncSession,
    *,
    event_type: str,
    task_id: int,
    dedupe_key: str,
    payload: dict,
    now: datetime,
) -> None:
    session.add(
        OutboxEvent(
            id=uuid4(),
            event_type=event_type,
            aggregate_type="task",
            aggregate_id=str(task_id),
            dedupe_key=dedupe_key,
            payload=payload,
            status="pending",
            attempts=0,
            next_attempt_at=now,
            created_at=now,
        )
    )


def emit_rejection(session: AsyncSession, command, reason: str) -> None:
    now = utcnow()
    payload = TaskExecutionFailedPayload(
        taskId=command.task_id,
        runId=str(command.task_run_id),
        ownerUserId=command.owner_user_id,
        executor=EXECUTOR,
        workerId="vk-command-consumer",
        executionSequence=1,
        processedItems=0,
        totalItems=0,
        stats={},
        error=reason[:2000],
        failureKind="rejected",
        failedAt=now.isoformat(),
    )
    add_outbox(
        session,
        event_type="task.execution_failed",
        task_id=command.task_id,
        dedupe_key=f"task.execution_failed:rejected:{command.execution_id}",
        payload=payload.model_dump(mode="json"),
        now=now,
    )


def mark_binding_started(
    session: AsyncSession,
    binding: VkTaskRunBinding,
    attempt: VkExecutionAttempt,
) -> None:
    if binding.status != "pending":
        return
    now = utcnow()
    binding.status = "running"
    binding.started_at = binding.started_at or now
    binding.execution_sequence += 1
    binding.updated_at = now
    payload = TaskExecutionStartedPayload(
        taskId=binding.task_id,
        runId=binding.run_id,
        ownerUserId=binding.owner_user_id,
        executor=EXECUTOR,
        workerId=attempt.worker_id,
        attempt=attempt.attempt_number,
        executionSequence=binding.execution_sequence,
        providerAccountKey=attempt.provider_account_key,
        credentialVersion=attempt.credential_version,
        startedAt=now.isoformat(),
    )
    add_outbox(
        session,
        event_type="task.execution_started",
        task_id=binding.task_id,
        dedupe_key=f"task.execution_started:{binding.id}",
        payload=payload.model_dump(mode="json", exclude_none=True),
        now=now,
    )
