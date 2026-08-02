"""Executes claimed VK tasks with provider-account awareness and finalization."""

import asyncio
import logging

from app.domain.entities.tasks import VkTaskRun
from app.domain.exceptions.provider_account import ProviderAccountBlockedError
from app.domain.exceptions.vk_api import VkApiAuthError
from app.services.ingestion.pipeline import IngestionFailedError
from app.tasks.provider_account_guard import ensure_provider_available, mark_account_invalid
from app.tasks.task_finalizer import TaskFinalizer
from app.tasks.task_run_runner import LeaseLostError, TaskRunRunner
from app.tasks.vk_client_binding import bind_task_vk_client

logger = logging.getLogger("vk-service.task-worker")


class TaskExecutor:
    def __init__(
        self,
        *,
        worker_id: str,
        lease_store,
        session_factory,
        ingestion_factory,
        vk_client,
        provider_accounts_factory,
        lease_seconds: int,
        heartbeat_seconds: int,
        timeout_seconds: int,
        max_attempts: int,
        account_gate=None,
    ):
        self.worker_id = worker_id
        self.lease_store = lease_store
        self.session_factory = session_factory
        self.provider_accounts_factory = provider_accounts_factory
        self.timeout_seconds = timeout_seconds
        self.max_attempts = max_attempts
        self.account_gate = account_gate
        self.finalizer = TaskFinalizer(worker_id=worker_id, lease_store=lease_store)
        self.runner = TaskRunRunner(
            lease_store=lease_store,
            session_factory=session_factory,
            ingestion_factory=ingestion_factory,
            worker_id=worker_id,
            lease_seconds=lease_seconds,
            heartbeat_seconds=heartbeat_seconds,
            timeout_seconds=timeout_seconds,
            adapter_factory=lambda _session, task_run: bind_task_vk_client(
                vk_client, task_run
            ),
        )

    async def execute(self, task_run: VkTaskRun) -> None:
        logger.info(
            "Claimed VK task task_id=%s run_id=%s attempt=%s worker=%s",
            task_run.task_id,
            task_run.run_id,
            task_run.attempts,
            self.worker_id,
        )
        if task_run.attempts > self.max_attempts:
            await self.finalizer.fail(task_run, "Task lease recovery attempts exhausted")
            return
        try:
            await ensure_provider_available(self.account_gate)
            result = await self.runner.run(task_run)
            await self._mark_done(
                task_run,
                processed_items=result.processed_items,
                total_items=result.processed_items,
                stats=result.stats(),
            )
            logger.info("Completed VK task task_id=%s", task_run.task_id)
        except LeaseLostError:
            logger.warning(
                "Lease lost for task_id=%s; execution cancelled", task_run.task_id
            )
        except IngestionFailedError as exc:
            await self.finalizer.fail(
                task_run,
                exc.error,
                processed_items=exc.result.processed_items,
                total_items=exc.result.processed_items,
                stats=exc.result.stats(),
            )
        except TimeoutError:
            await self.finalizer.fail(
                task_run,
                f"Task timed out after {self.timeout_seconds}s",
                processed_items=task_run.processed_items,
                total_items=task_run.total_items,
            )
        except asyncio.CancelledError:
            raise
        except VkApiAuthError as error:
            await mark_account_invalid(
                self.session_factory,
                self.provider_accounts_factory,
                self.account_gate,
                error,
            )
            await self.finalizer.release_blocked(task_run, "provider_account_invalid")
            logger.warning(
                "VK provider account invalid for task_id=%s run_id=%s (code=%s); "
                "released without retry",
                task_run.task_id,
                task_run.run_id,
                error.code,
            )
        except ProviderAccountBlockedError:
            await self.finalizer.release_blocked(task_run, "provider_account_blocked")
            logger.warning(
                "Provider account blocked for task_id=%s run_id=%s; released without retry",
                task_run.task_id,
                task_run.run_id,
            )
        except Exception as exc:
            await self.finalizer.fail(task_run, str(exc) or type(exc).__name__)

    async def _mark_done(
        self,
        task_run: VkTaskRun,
        *,
        processed_items: int,
        total_items: int,
        stats: dict,
    ) -> None:
        try:
            recorded = await self.lease_store.done(
                task_id=task_run.task_id,
                run_id=task_run.run_id,
                worker_id=self.worker_id,
                processed_items=processed_items,
                total_items=total_items,
                stats=stats,
            )
            if not recorded:
                logger.warning(
                    "Completion for task_id=%s was not recorded because lease ownership was lost",
                    task_run.task_id,
                )
        except Exception as exc:
            logger.warning(
                "Failed to mark task_id=%s as done: %s. Releasing lease for retry.",
                task_run.task_id,
                exc,
            )
            await self.finalizer.release(
                task_run,
                f"completion recording failed: {exc}",
            )
