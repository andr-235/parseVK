import inspect
from collections.abc import AsyncIterator

from sqlalchemy import select

from app.infrastructure.db.models.executions import VkExecution, VkExecutionAttempt
from app.infrastructure.metrics.execution_metrics import observe_fence_rejected


class FenceLostError(RuntimeError):
    pass


class ExecutionCancellationRequested(RuntimeError):
    pass


class ExecutionAttemptControl:
    def __init__(self, *, claim, session_factory):
        self.claim = claim
        self.session_factory = session_factory

    async def ensure_active(self) -> None:
        """Check ownership without taking locks held across external work."""
        async with self.session_factory() as session:
            async with session.begin():
                await self._ensure_active(session, lock=False)

    async def ensure_active_in_session(self, session) -> None:
        """Fence a pending database commit in the transaction being committed."""
        await self._ensure_active(session, lock=True)

    async def _ensure_active(self, session, *, lock: bool) -> None:
        execution_query = select(VkExecution).where(
            VkExecution.id == self.claim.execution_id
        )
        if lock:
            execution_query = execution_query.with_for_update()
        execution = await session.scalar(execution_query)

        if execution is None:
            observe_fence_rejected("guard_missing_execution")
            raise FenceLostError("execution no longer exists")
        if execution.cancellation_requested_at is not None:
            raise ExecutionCancellationRequested(
                execution.cancellation_reason or "execution cancellation requested"
            )
        if (
            execution.status != "running"
            or execution.current_attempt_id != self.claim.attempt_id
            or execution.current_fencing_token != self.claim.fencing_token
        ):
            observe_fence_rejected("guard_execution")
            raise FenceLostError("execution fencing token is no longer current")

        attempt_query = select(VkExecutionAttempt).where(
            VkExecutionAttempt.id == self.claim.attempt_id
        )
        if lock:
            attempt_query = attempt_query.with_for_update()
        attempt = await session.scalar(attempt_query)

        if (
            attempt is None
            or attempt.execution_id != self.claim.execution_id
            or attempt.status != "running"
            or attempt.fencing_token != self.claim.fencing_token
        ):
            observe_fence_rejected("guard_attempt")
            raise FenceLostError("execution attempt is no longer active")


class FencedVkApiClient:
    """Check cancellation and fencing before and after each VK request."""

    def __init__(self, inner, control: ExecutionAttemptControl):
        self._inner = inner
        self._control = control

    def __getattr__(self, name):
        target = getattr(self._inner, name)
        if name == "iter_comment_pages":

            def guarded_iterator(*args, **kwargs) -> AsyncIterator[dict]:
                return self._guard_iterator(target, *args, **kwargs)

            return guarded_iterator
        if not callable(target):
            return target

        async def guarded(*args, **kwargs):
            await self._control.ensure_active()
            result = target(*args, **kwargs)
            if inspect.isawaitable(result):
                result = await result
            await self._control.ensure_active()
            return result

        return guarded

    async def _guard_iterator(self, target, *args, **kwargs):
        iterator = target(*args, **kwargs).__aiter__()
        try:
            while True:
                await self._control.ensure_active()
                try:
                    item = await anext(iterator)
                except StopAsyncIteration:
                    return
                await self._control.ensure_active()
                yield item
        finally:
            close = getattr(iterator, "aclose", None)
            if close is not None:
                await close()
