import logging
from datetime import UTC, datetime
from typing import Any, Dict

from sqlalchemy import text

from app.domain.repositories.outbox import OutboxRepository
from common.events.task_execution_completed import TaskExecutionCompletedPayload
from common.events.task_execution_failed import TaskExecutionFailedPayload
from common.events.task_execution_progressed import TaskExecutionProgressedPayload
from common.events.task_execution_started import TaskExecutionStartedPayload

logger = logging.getLogger(__name__)


class OutboxService:
    def __init__(self, repository: OutboxRepository, session=None):
        self.repository = repository
        self.session = session

    async def emit_group_collected(self, group: dict, *, correlation_id: str | None = None) -> None:
        vk_group_id = int(group["id"])
        await self.repository.add_event(
            event_type="vk.group_collected",
            aggregate_type="vk_group",
            aggregate_id=str(vk_group_id),
            correlation_id=correlation_id,
            payload={"vkGroupId": vk_group_id, "group": group},
        )

    async def emit_group_deleted(self, vk_group_id: int, *, correlation_id: str | None = None) -> None:
        await self.repository.add_event(
            event_type="vk.group_deleted",
            aggregate_type="vk_group",
            aggregate_id=str(vk_group_id),
            correlation_id=correlation_id,
            payload={"vkGroupId": vk_group_id},
        )

    async def emit_post_collected(self, post: dict, *, task_id: int, correlation_id: str | None = None) -> None:
        owner_id = int(post.get("owner_id", 0))
        post_id = int(post.get("id", 0))
        await self.repository.add_event(
            event_type="vk.post_collected",
            aggregate_type="vk_post",
            aggregate_id=f"{owner_id}:{post_id}",
            correlation_id=correlation_id,
            dedupe_key=f"vk.post_collected:{owner_id}:{post_id}",
            payload={"taskId": task_id, "vkOwnerId": owner_id, "vkPostId": post_id, "post": post},
        )

    async def emit_comments_collected_batch(
        self,
        *,
        batch_id: str,
        chunk_index: int,
        chunk_count: int,
        comments: list[dict],
        authors: list[dict],
        owner_id: int,
        post_id: int,
        task_id: int,
        run_id: str | None = None,
        correlation_id: str | None = None,
        source_position: str | None = None,
    ) -> None:
        import json
        payload = {
            "batchId": batch_id,
            "chunkIndex": chunk_index,
            "chunkCount": chunk_count,
            "comments": comments,
            "authors": authors,
            "sourcePosition": source_position,
            "taskId": task_id,
            "runId": run_id,
            "ownerId": owner_id,
            "postId": post_id,
        }
        await self.repository.add_event(
            event_type="vk.comments_collected",
            aggregate_type="vk_comment",
            aggregate_id=f"{owner_id}:{post_id}",
            correlation_id=correlation_id,
            dedupe_key=f"vk.comments_collected:{batch_id}:{chunk_index}",
            event_version=1,
            payload=payload,
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
        """Emit task.execution_started event via outbox."""
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
        await self.repository.add_event(
            event_type="task.execution_started",
            aggregate_type="task",
            aggregate_id=str(task_id),
            correlation_id=correlation_id,
            dedupe_key=f"task.execution_started:{task_id}:{run_id}:{execution_sequence}",
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
        stats: Dict[str, Any] | None = None,
        completed_at: str | None = None,
        correlation_id: str | None = None,
    ) -> None:
        """Emit task.execution_completed event via outbox."""
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
        await self.repository.add_event(
            event_type="task.execution_completed",
            aggregate_type="task",
            aggregate_id=str(task_id),
            correlation_id=correlation_id,
            dedupe_key=f"task.execution_completed:{task_id}:{run_id}:{execution_sequence}",
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
        stats: Dict[str, Any] | None = None,
        error: str = "",
        failure_kind: str = "terminal",
        failed_at: str | None = None,
        correlation_id: str | None = None,
    ) -> None:
        """Emit task.execution_failed event via outbox."""
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
        await self.repository.add_event(
            event_type="task.execution_failed",
            aggregate_type="task",
            aggregate_id=str(task_id),
            correlation_id=correlation_id,
            dedupe_key=f"task.execution_failed:{task_id}:{run_id}:{execution_sequence}",
            payload=payload.model_dump(mode="json"),
        )

    async def emit_execution_progressed(
        self,
        task_id: int,
        run_id: str,
        owner_user_id: str,
        executor: str,
        processed_items: int,
        total_items: int,
        progress: float,
        stats: dict[str, Any] | None = None,
        occurred_at: str | None = None,
        correlation_id: str | None = None,
    ) -> None:
        """Emit task.execution_progressed event via outbox with durable sequence."""
        session = self.session or getattr(self.repository, "session", None)
        if session is None:
            raise RuntimeError("emit_execution_progressed requires an async SQLAlchemy session")

        result = await session.execute(
            text("""
                UPDATE vk_task_runs
                SET execution_sequence = execution_sequence + 1
                WHERE run_id = :run_id
                RETURNING execution_sequence
            """),
            {"run_id": run_id},
        )
        row = result.one_or_none()
        if row is None:
            logger.warning("vk_task_run %s not found, skipping progress event", run_id)
            return

        execution_sequence = row[0]

        payload = TaskExecutionProgressedPayload(
            taskId=task_id,
            runId=run_id,
            ownerUserId=owner_user_id,
            executor=executor,
            executionSequence=execution_sequence,
            processedItems=processed_items,
            totalItems=total_items,
            progress=progress,
            stats=stats or {},
            occurredAt=occurred_at or datetime.now(UTC).isoformat(),
        )

        await self.repository.add_event(
            event_type="task.execution_progressed",
            aggregate_type="vk_task",
            aggregate_id=str(task_id),
            correlation_id=correlation_id,
            dedupe_key=f"task.execution_progressed:{task_id}:{run_id}:{execution_sequence}",
            payload=payload.model_dump(mode="json"),
        )
