import logging
from collections.abc import Awaitable, Callable
from dataclasses import replace
from typing import Any

from app.domain.repositories.checkpoint import CheckpointData, IngestionCheckpointStore
from app.services.ingestion.result import IngestionResult

logger = logging.getLogger("vk-service.ingestion")


class CheckpointFlow:
    def __init__(
        self,
        *,
        store: IngestionCheckpointStore | None,
        commit_page: Callable[[], Awaitable[None]] | None,
        rollback_page: Callable[[], Awaitable[None]] | None = None,
        on_error: Callable[[str], str],
    ) -> None:
        self.store = store
        self.commit_page = commit_page
        self.rollback_page = rollback_page
        self.on_error = on_error

    async def resume(
        self,
        task_run: Any,
        group_id: int,
        owner_id: int,
        post_id: int,
        result: IngestionResult,
    ) -> tuple[int, CheckpointData | None, bool]:
        if self.store is None:
            return 0, None, False
        checkpoint = await self.store.load(task_run.run_id, owner_id, post_id)
        if checkpoint is not None and checkpoint.status in {"completed", "failed"}:
            result.comments += checkpoint.processed_comments
            if checkpoint.status == "failed":
                result.errors.append(
                    {
                        "owner_id": owner_id,
                        "post_id": post_id,
                        "error": checkpoint.last_error,
                    }
                )
            return 0, checkpoint, True
        if checkpoint is None:
            await self.store.save(
                CheckpointData(
                    run_id=task_run.run_id,
                    owner_id=owner_id,
                    post_id=post_id,
                    task_id=task_run.task_id,
                    group_id=group_id,
                    next_offset=0,
                    status="in_progress",
                )
            )
            return 0, None, False
        return checkpoint.next_offset, checkpoint, False

    async def complete(
        self,
        task_run: Any,
        owner_id: int,
        post_id: int,
    ) -> None:
        if self.store is not None:
            await self.store.complete(task_run.run_id, owner_id, post_id)
        await self.commit()

    async def fail(
        self,
        task_run: Any,
        group_id: int,
        owner_id: int,
        post_id: int,
        error: Exception,
        result: IngestionResult,
    ) -> None:
        sanitized = self.on_error(str(error))
        logger.error(
            "Comment collection failed for post %d_%d: %s",
            owner_id,
            post_id,
            sanitized,
        )
        result.errors.append(
            {"owner_id": owner_id, "post_id": post_id, "error": sanitized}
        )

        # A page may already have flushed staging, parts, authors or comments.
        # Discard the entire unfinished page before persisting terminal evidence.
        await self.rollback()
        if self.store is not None:
            checkpoint = await self.store.load(task_run.run_id, owner_id, post_id)
            if checkpoint is None:
                checkpoint = CheckpointData(
                    run_id=task_run.run_id,
                    owner_id=owner_id,
                    post_id=post_id,
                    task_id=task_run.task_id,
                    group_id=group_id,
                    status="failed",
                    last_error=sanitized,
                )
            else:
                checkpoint = replace(
                    checkpoint,
                    status="failed",
                    last_error=sanitized,
                )
            await self.store.save(checkpoint)
        await self.commit()

    async def commit(self) -> None:
        if self.commit_page is not None:
            await self.commit_page()

    async def rollback(self) -> None:
        if self.rollback_page is not None:
            await self.rollback_page()
