"""Started lifecycle aggregation for canonical TaskRuns."""

from common.events.task_execution_started import TaskExecutionStartedPayload
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.source_collections import VkTaskRunBinding
from app.infrastructure.db.repositories.canonical_command_events import (
    EXECUTOR,
    add_outbox,
    utcnow,
)
from app.infrastructure.db.repositories.canonical_command_locks import advisory_lock


async def mark_bindings_started(session: AsyncSession, demands, attempt) -> None:
    for binding_id in sorted({d.binding_id for d in demands}, key=str):
        await advisory_lock(session, f"binding:{binding_id}")
        binding = await session.scalar(
            select(VkTaskRunBinding)
            .where(VkTaskRunBinding.id == binding_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        if binding is None or binding.status != "pending":
            continue
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
