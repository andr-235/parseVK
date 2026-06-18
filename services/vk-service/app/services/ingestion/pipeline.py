import asyncio
import logging
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any

import httpx
import sqlalchemy.exc

from app.infrastructure.tasks_client.client import TasksClient
from app.services.ingestion.collector import IngestionResult

def utcnow() -> datetime:
    return datetime.now(UTC)

class IngestionPipeline:
    def __init__(
        self,
        *,
        collector,
        tasks_client: TasksClient,
        outbox=None,
        on_error: Callable[[str], str] | None = None,
    ):
        self.collector = collector
        self.tasks_client = tasks_client
        self.outbox = outbox
        self._on_error = on_error or (lambda msg: msg)

    async def execute(
        self, task_run: Any, *, correlation_id: str | None = None
    ) -> IngestionResult:
        try:
            group_ids = await self.collector.get_group_ids(task_run)
            result = await self.collector.collect(
                task_run, group_ids, correlation_id=correlation_id
            )

            task_run.status = "done"
            task_run.finished_at = utcnow()
            task_run.processed_items = result.processed_items
            task_run.total_items = result.processed_items
            task_run.updated_at = utcnow()

            await self.tasks_client.complete_execution(
                task_run.task_id,
                task_run.run_id,
                result.processed_items,
                result.processed_items,
                result.stats(),
                request_id=task_run.run_id,
                correlation_id=correlation_id,
            )
            if self.outbox:
                await self.outbox.emit_task_completed(
                    task_id=task_run.task_id,
                    run_id=task_run.run_id,
                    stats=result.stats(),
                    correlation_id=correlation_id,
                )
            return result

        except Exception as exc:
            logger = logging.getLogger("vk-service.ingestion")
            logger.exception(
                "Task execution failed for task_run.task_id=%s", task_run.task_id
            )
            sanitized_error = self._on_error(str(exc))

            task_run.status = "failed"
            task_run.finished_at = utcnow()
            task_run.last_error = sanitized_error
            task_run.processed_items = getattr(task_run, "processed_items", 0)
            task_run.total_items = getattr(task_run, "total_items", 0)
            task_run.updated_at = utcnow()

            if self.outbox:
                await self.outbox.emit_task_failed(
                    task_id=task_run.task_id,
                    run_id=task_run.run_id,
                    error=sanitized_error,
                    correlation_id=correlation_id,
                )

            try:
                await self.tasks_client.fail_execution(
                    task_run.task_id,
                    task_run.run_id,
                    sanitized_error,
                    task_run.processed_items,
                    task_run.total_items,
                    {},
                    request_id=task_run.run_id,
                    correlation_id=correlation_id,
                )
            except httpx.HTTPStatusError as callback_exc:
                if callback_exc.response.status_code == 409:
                    detail = "Unknown conflict"
                    try:
                        detail = callback_exc.response.json().get("detail", detail)
                    except Exception:
                        pass
                    task_run.last_error = (
                        f"{sanitized_error} | Callback conflict: {detail}"
                    )

                    logger = logging.getLogger("vk-service.ingestion")
                    logger.warning(
                        "Fail callback returned 409 for task_id=%s, run_id=%s. Detail: %s. "
                        "Not retrying as tasks-service is in a different lifecycle state.",
                        task_run.task_id,
                        task_run.run_id,
                        detail,
                    )
                else:
                    raise callback_exc from exc

            except (
                httpx.RequestError,
                sqlalchemy.exc.DBAPIError,
                asyncio.CancelledError,
            ) as callback_exc:
                raise callback_exc from exc

            is_infra_error = isinstance(
                exc, (sqlalchemy.exc.DBAPIError, asyncio.CancelledError)
            )
            if isinstance(exc, httpx.RequestError) and not isinstance(
                exc, httpx.HTTPStatusError
            ):
                is_infra_error = True
            elif (
                isinstance(exc, httpx.HTTPStatusError)
                and exc.response.status_code >= 500
            ):
                is_infra_error = True

            if is_infra_error:
                raise

            return IngestionResult()
