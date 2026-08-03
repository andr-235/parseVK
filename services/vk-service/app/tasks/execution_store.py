from datetime import UTC, datetime, timedelta

from sqlalchemy import exists, select

from app.infrastructure.db.models.executions import VkExecutionAttempt
from app.infrastructure.db.repositories.executions import SqlAlchemyExecutionRepository
from app.infrastructure.metrics.execution_metrics import (
    observe_attempt_released,
    observe_attempt_started,
    observe_fence_rejected,
    observe_terminal,
)


class ExecutionStore:
    def __init__(self, session_factory):
        self.session_factory = session_factory

    async def claim(self, *, worker_id: str, lease_expires_at: datetime):
        async with self.session_factory() as session:
            async with session.begin():
                repository = SqlAlchemyExecutionRepository(session)
                claim = await repository.claim_next(
                    worker_id=worker_id,
                    lease_expires_at=lease_expires_at,
                )
                recovered = False
                if claim is not None and claim.attempt_number > 1:
                    recovered = bool(
                        await session.scalar(
                            select(
                                exists().where(
                                    VkExecutionAttempt.execution_id
                                    == claim.execution_id,
                                    VkExecutionAttempt.attempt_number
                                    == claim.attempt_number - 1,
                                    VkExecutionAttempt.status == "expired",
                                )
                            )
                        )
                    )

        if claim is not None:
            observe_attempt_started(recovered=recovered)
        return claim

    async def renew(self, **kwargs) -> bool:
        renewed = await self._call("renew", **kwargs)
        if not renewed:
            observe_fence_rejected("heartbeat")
        return renewed

    async def complete(self, **kwargs) -> bool:
        completed = await self._call("complete", **kwargs)
        if completed:
            observe_terminal("done")
        else:
            observe_fence_rejected("complete")
        return completed

    async def fail(self, **kwargs) -> bool:
        failed = await self._call("fail", **kwargs)
        if failed:
            observe_terminal("failed")
        else:
            observe_fence_rejected("fail")
        return failed

    async def cancel(self, **kwargs) -> bool:
        cancelled = await self._call("cancel", **kwargs)
        if cancelled:
            observe_terminal("cancelled")
        else:
            observe_fence_rejected("cancel")
        return cancelled

    async def release(self, **kwargs) -> bool:
        released = await self._call("release", **kwargs)
        if released:
            observe_attempt_released()
        else:
            observe_fence_rejected("release")
        return released

    async def _call(self, method_name: str, **kwargs):
        async with self.session_factory() as session:
            async with session.begin():
                repository = SqlAlchemyExecutionRepository(session)
                return await getattr(repository, method_name)(**kwargs)


def lease_deadline(seconds: int) -> datetime:
    return datetime.now(UTC) + timedelta(seconds=seconds)


def immediate_retry() -> datetime:
    return datetime.now(UTC)
