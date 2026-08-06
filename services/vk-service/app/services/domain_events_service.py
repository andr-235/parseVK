from datetime import UTC, datetime
from typing import Any

from common.events.task_execution_completed import TaskExecutionCompletedPayload
from common.events.task_execution_failed import TaskExecutionFailedPayload
from common.events.task_execution_started import TaskExecutionStartedPayload

from app.domain.repositories.outbox import OutboxRepository


class OutboxService:
    def __init__(self, repository: OutboxRepository, session=None):
        self.repository, self.session = repository, session

    async def emit_group_collected(
        self,
        group: dict,
        *,
        correlation_id: str | None = None,
    ) -> None:
        vk_group_id = int(group["id"])
        await self.repository.add_event(
            event_type="vk.group_collected",
            aggregate_type="vk_group",
            aggregate_id=str(vk_group_id),
            correlation_id=correlation_id,
            payload={"vkGroupId": vk_group_id, "group": group},
        )

    async def emit_group_deleted(
        self,
        vk_group_id: int,
        *,
        correlation_id: str | None = None,
    ) -> None:
        await self.repository.add_event(
            event_type="vk.group_deleted",
            aggregate_type="vk_group",
            aggregate_id=str(vk_group_id),
            correlation_id=correlation_id,
            payload={"vkGroupId": vk_group_id},
        )

    async def emit_execution_started(
        self,
        task_id: int,
        run_id: str,
        owner_user_id: str,
        executor: str,
        worker_id: str,
        attempt: int,
        execution_sequence: int,
        started_at: str | None = None,
        correlation_id: str | None = None,
    ) -> None:
        payload = TaskExecutionStartedPayload(
            taskId=task_id,
            runId=run_id,
            ownerUserId=owner_user_id,
            executor=executor,
            workerId=worker_id,
            attempt=attempt,
            executionSequence=execution_sequence,
            startedAt=started_at or datetime.now(UTC).isoformat(),
        )
        dedupe_key = f"task.execution_started:{task_id}:{run_id}:{execution_sequence}"
        await self.repository.add_event(
            event_type="task.execution_started",
            aggregate_type="task",
            aggregate_id=str(task_id),
            correlation_id=correlation_id,
            dedupe_key=dedupe_key,
            payload=payload.model_dump(mode="json"),
        )

    async def emit_execution_completed(
        self,
        task_id: int,
        run_id: str,
        owner_user_id: str,
        executor: str,
        worker_id: str,
        execution_sequence: int,
        processed_items: int,
        total_items: int,
        stats: dict[str, Any] | None = None,
        completed_at: str | None = None,
        correlation_id: str | None = None,
    ) -> None:
        payload = TaskExecutionCompletedPayload(
            taskId=task_id,
            runId=run_id,
            ownerUserId=owner_user_id,
            executor=executor,
            workerId=worker_id,
            executionSequence=execution_sequence,
            processedItems=processed_items,
            totalItems=total_items,
            stats=stats or {},
            completedAt=completed_at or datetime.now(UTC).isoformat(),
        )
        dedupe_key = f"task.execution_completed:{task_id}:{run_id}:{execution_sequence}"
        await self.repository.add_event(
            event_type="task.execution_completed",
            aggregate_type="task",
            aggregate_id=str(task_id),
            correlation_id=correlation_id,
            dedupe_key=dedupe_key,
            payload=payload.model_dump(mode="json"),
        )

    async def emit_execution_failed(
        self,
        task_id: int,
        run_id: str,
        owner_user_id: str,
        executor: str,
        worker_id: str,
        execution_sequence: int,
        processed_items: int,
        total_items: int,
        stats: dict[str, Any] | None = None,
        error: str = "",
        failure_kind: str = "terminal",
        failed_at: str | None = None,
        correlation_id: str | None = None,
    ) -> None:
        payload = TaskExecutionFailedPayload(
            taskId=task_id,
            runId=run_id,
            ownerUserId=owner_user_id,
            executor=executor,
            workerId=worker_id,
            executionSequence=execution_sequence,
            processedItems=processed_items,
            totalItems=total_items,
            stats=stats or {},
            error=error,
            failureKind=failure_kind,
            failedAt=failed_at or datetime.now(UTC).isoformat(),
        )
        dedupe_key = f"task.execution_failed:{task_id}:{run_id}:{execution_sequence}"
        await self.repository.add_event(
            event_type="task.execution_failed",
            aggregate_type="task",
            aggregate_id=str(task_id),
            correlation_id=correlation_id,
            dedupe_key=dedupe_key,
            payload=payload.model_dump(mode="json"),
        )
