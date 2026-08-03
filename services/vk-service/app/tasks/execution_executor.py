"""Execute one fenced VK execution attempt."""

import asyncio
import logging

from app.domain.exceptions.provider_account import (
    ProviderAccountBlockedError,
    ProviderCredentialChangedError,
)
from app.domain.exceptions.vk_api import VkApiAuthError
from app.services.ingestion.pipeline import IngestionFailedError
from app.tasks.execution_control import (
    ExecutionAttemptControl,
    ExecutionCancellationRequested,
    FenceLostError,
)
from app.tasks.execution_runner import ExecutionAttemptRunner
from app.tasks.execution_store import immediate_retry
from app.tasks.provider_account_guard import (
    block_account_version,
    ensure_provider_available,
    mark_account_invalid,
)
from app.tasks.vk_client_binding import bind_execution_vk_client

logger = logging.getLogger("vk-service.execution-worker")


class ExecutionExecutor:
    def __init__(
        self,
        *,
        worker_id: str,
        execution_store,
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
        self.execution_store = execution_store
        self.session_factory = session_factory
        self.provider_accounts_factory = provider_accounts_factory
        self.timeout_seconds = timeout_seconds
        self.max_attempts = max_attempts
        self.account_gate = account_gate
        self.runner = ExecutionAttemptRunner(
            execution_store=execution_store,
            session_factory=session_factory,
            ingestion_factory=ingestion_factory,
            lease_seconds=lease_seconds,
            heartbeat_seconds=heartbeat_seconds,
            timeout_seconds=timeout_seconds,
            adapter_factory=lambda _session, claim: bind_execution_vk_client(
                vk_client, claim
            ),
        )

    async def execute(self, claim) -> None:
        control = ExecutionAttemptControl(
            claim=claim,
            session_factory=self.session_factory,
        )
        logger.info(
            "Claimed VK execution execution_id=%s run_id=%s attempt=%s fence=%s worker=%s",
            claim.execution_id,
            claim.run_id,
            claim.attempt_number,
            claim.fencing_token,
            self.worker_id,
        )
        if claim.attempt_number > self.max_attempts:
            await self._fail(claim, "Execution recovery attempts exhausted")
            return
        try:
            await ensure_provider_available(self.account_gate)
            await control.ensure_active()
            result = await self.runner.run(claim, control)
            recorded = await self.execution_store.complete(
                execution_id=claim.execution_id,
                attempt_id=claim.attempt_id,
                fencing_token=claim.fencing_token,
                processed_items=result.processed_items,
                total_items=result.processed_items,
                stats=result.stats(),
            )
            if not recorded and not await self._cancel_if_requested(claim):
                logger.warning(
                    "Completion rejected by fence execution_id=%s attempt_id=%s",
                    claim.execution_id,
                    claim.attempt_id,
                )
        except ExecutionCancellationRequested:
            await self._cancel_if_requested(claim)
        except FenceLostError:
            logger.warning(
                "Stale execution attempt stopped execution_id=%s attempt_id=%s fence=%s",
                claim.execution_id,
                claim.attempt_id,
                claim.fencing_token,
            )
        except IngestionFailedError as exc:
            await self._fail(
                claim,
                exc.error,
                processed_items=exc.result.processed_items,
                total_items=exc.result.processed_items,
                stats=exc.result.stats(),
            )
        except TimeoutError:
            await self._fail(
                claim,
                f"Execution timed out after {self.timeout_seconds}s",
                processed_items=claim.processed_items,
                total_items=claim.total_items,
            )
        except asyncio.CancelledError:
            await self.execution_store.release(
                execution_id=claim.execution_id,
                attempt_id=claim.attempt_id,
                fencing_token=claim.fencing_token,
                error="worker shutdown",
                available_at=immediate_retry(),
            )
            raise
        except VkApiAuthError as error:
            await mark_account_invalid(
                self.session_factory,
                self.provider_accounts_factory,
                self.account_gate,
                error,
                credential_version=claim.credential_version,
            )
            await self._release(claim, "provider_account_invalid")
        except ProviderCredentialChangedError:
            await block_account_version(
                self.session_factory,
                self.provider_accounts_factory,
                self.account_gate,
                credential_version=claim.credential_version,
                error_code=None,
                error_kind="credential_changed",
            )
            await self._release(claim, "provider_credential_changed")
        except ProviderAccountBlockedError:
            await self._release(claim, "provider_account_blocked")
        except Exception as exc:
            await self._fail(claim, str(exc) or type(exc).__name__)

    async def _fail(
        self,
        claim,
        error: str,
        *,
        processed_items: int = 0,
        total_items: int = 0,
        stats: dict | None = None,
    ) -> None:
        recorded = await self.execution_store.fail(
            execution_id=claim.execution_id,
            attempt_id=claim.attempt_id,
            fencing_token=claim.fencing_token,
            error=error[:2000],
            processed_items=processed_items,
            total_items=total_items,
            stats=stats or {},
        )
        if not recorded and not await self._cancel_if_requested(claim):
            logger.warning(
                "Failure rejected by fence execution_id=%s attempt_id=%s",
                claim.execution_id,
                claim.attempt_id,
            )

    async def _cancel_if_requested(self, claim) -> bool:
        """Let a durable cancellation win a race with terminal recording.

        A stale attempt is still safe: its cancellation write is rejected by the
        same attempt id and fencing token checks.
        """
        return await self.execution_store.cancel(
            execution_id=claim.execution_id,
            attempt_id=claim.attempt_id,
            fencing_token=claim.fencing_token,
        )

    async def _release(self, claim, reason: str) -> None:
        await self.execution_store.release(
            execution_id=claim.execution_id,
            attempt_id=claim.attempt_id,
            fencing_token=claim.fencing_token,
            error=reason,
            available_at=immediate_retry(),
        )
