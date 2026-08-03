"""Run one fenced VK execution attempt with heartbeat and timeout."""

import asyncio
import inspect
from datetime import UTC, datetime, timedelta

from app.tasks.execution_control import FenceLostError, FencedVkApiClient


class ExecutionAttemptRunner:
    def __init__(
        self,
        *,
        execution_store,
        session_factory,
        ingestion_factory,
        lease_seconds: int,
        heartbeat_seconds: int,
        timeout_seconds: int,
        adapter_factory,
    ):
        self.execution_store = execution_store
        self.session_factory = session_factory
        self.ingestion_factory = ingestion_factory
        self.lease_seconds = lease_seconds
        self.heartbeat_seconds = heartbeat_seconds
        self.timeout_seconds = timeout_seconds
        self.adapter_factory = adapter_factory

    async def run(self, claim, control):
        ingestion_task = asyncio.create_task(self._run_ingestion(claim, control))
        heartbeat_task = asyncio.create_task(self._heartbeat(claim, control))
        try:
            async with asyncio.timeout(self.timeout_seconds):
                done, _ = await asyncio.wait(
                    {ingestion_task, heartbeat_task},
                    return_when=asyncio.FIRST_COMPLETED,
                )
                if heartbeat_task in done:
                    await heartbeat_task
                return await ingestion_task
        finally:
            for task in (ingestion_task, heartbeat_task):
                if not task.done():
                    task.cancel()
            await asyncio.gather(ingestion_task, heartbeat_task, return_exceptions=True)

    async def _run_ingestion(self, claim, control):
        async with self.session_factory() as session:
            adapter = self.adapter_factory(session, claim)
            if inspect.isawaitable(adapter):
                adapter = await adapter
            adapter = FencedVkApiClient(adapter, control)
            service = self.ingestion_factory(
                session,
                adapter=adapter,
                attempt_control=control,
            )
            try:
                await control.ensure_active_in_session(session)
                result = await service.execute(claim, correlation_id=claim.run_id)
                await control.ensure_active_in_session(session)
                await session.commit()
                return result
            except asyncio.CancelledError:
                await session.rollback()
                raise
            except Exception:
                await session.rollback()
                raise

    async def _heartbeat(self, claim, control) -> None:
        while True:
            await asyncio.sleep(self.heartbeat_seconds)
            renewed = await self.execution_store.renew(
                execution_id=claim.execution_id,
                attempt_id=claim.attempt_id,
                fencing_token=claim.fencing_token,
                lease_expires_at=datetime.now(UTC)
                + timedelta(seconds=self.lease_seconds),
            )
            if not renewed:
                await control.ensure_active()
                raise FenceLostError("execution lease could not be renewed")
