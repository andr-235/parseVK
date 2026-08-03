import inspect
from collections.abc import AsyncIterator

from sqlalchemy import select

from app.infrastructure.db.models.executions import VkExecution, VkExecutionAttempt


class FenceLostError(RuntimeError):
    pass


class ExecutionCancellationRequested(RuntimeError):
    pass


class ExecutionAttemptControl:
    def __init__(self, *, claim, session_factory):
        self.claim = claim
        self.session_factory = session_factory

    async def ensure_active(self) -> None:
        async with self.session_factory() as session:
            async with session.begin():
                await self.ensure_active_in_session(session)

    async def ensure_active_in_session(self, session) -> None:
        execution = await session.scalar(
            select(VkExecution)
            .where(VkExecution.id == self.claim.execution_id)
            .with_for_update()
        )
        if execution is None:
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
            raise FenceLostError("execution fencing token is no longer current")
        attempt = await session.scalar(
            select(VkExecutionAttempt)
            .where(VkExecutionAttempt.id == self.claim.attempt_id)
            .with_for_update()
        )
        if (
            attempt is None
            or attempt.status != "running"
            or attempt.fencing_token != self.claim.fencing_token
        ):
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
        await self._control.ensure_active()
        async for item in target(*args, **kwargs):
            await self._control.ensure_active()
            yield item
        await self._control.ensure_active()
