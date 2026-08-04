"""Execution repository for the single canonical source runtime."""

from sqlalchemy import delete

from app.infrastructure.db.models.executions import VkExecutionAttempt
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.repositories.canonical_binding_lifecycle import (
    demands_for_execution,
    finalize_bindings,
    mark_bindings_started,
    report_binding_progress,
)
from app.infrastructure.db.repositories.canonical_command_events import EXECUTOR
from app.infrastructure.db.repositories.executions import SqlAlchemyExecutionRepository

__all__ = ["CanonicalExecutionRepository", "report_binding_progress"]


class CanonicalExecutionRepository(SqlAlchemyExecutionRepository):
    async def claim_next(self, **kwargs):
        claim = await super().claim_next(**kwargs)
        if claim is None:
            return None
        demands = await demands_for_execution(
            self.session,
            claim.execution_id,
            active_only=True,
        )
        if not demands:
            raise RuntimeError(
                f"canonical execution {claim.execution_id} has no active demands"
            )
        keys = [
            f"task.execution_started:{demand.id}:{claim.attempt_number}"
            for demand in demands
        ]
        await self.session.execute(
            delete(OutboxEvent).where(
                OutboxEvent.event_type == "task.execution_started",
                OutboxEvent.dedupe_key.in_(keys),
            )
        )
        await mark_bindings_started(self.session, demands, claim.attempt)
        await self.session.flush()
        return claim

    async def complete(self, **kwargs) -> bool:
        completed = await super().complete(**kwargs)
        if not completed:
            return False
        demands = await demands_for_execution(
            self.session,
            kwargs["execution_id"],
            active_only=False,
        )
        await self._replace_demand_terminal_events(
            demands,
            event_type="task.execution_completed",
            processed_items=int(kwargs.get("processed_items") or 0),
            total_items=int(kwargs.get("total_items") or 0),
            stats=dict(kwargs.get("stats") or {}),
            worker_id=await self._worker_id(kwargs["attempt_id"]),
        )
        return True

    async def fail(self, **kwargs) -> bool:
        failed = await super().fail(**kwargs)
        if not failed:
            return False
        demands = await demands_for_execution(
            self.session,
            kwargs["execution_id"],
            active_only=False,
        )
        await self._replace_demand_terminal_events(
            demands,
            event_type="task.execution_failed",
            processed_items=int(kwargs.get("processed_items") or 0),
            total_items=int(kwargs.get("total_items") or 0),
            stats=dict(kwargs.get("stats") or {}),
            worker_id=await self._worker_id(kwargs["attempt_id"]),
        )
        return True

    async def cancel(self, **kwargs) -> bool:
        cancelled = await super().cancel(**kwargs)
        if not cancelled:
            return False
        demands = await demands_for_execution(
            self.session,
            kwargs["execution_id"],
            active_only=False,
        )
        await finalize_bindings(
            self.session,
            {d.binding_id for d in demands},
            worker_id=EXECUTOR,
        )
        await self.session.flush()
        return True

    async def release(self, **kwargs) -> bool:
        released = await super().release(**kwargs)
        if not released:
            return False
        demands = await demands_for_execution(
            self.session,
            kwargs["execution_id"],
            active_only=False,
        )
        await finalize_bindings(
            self.session,
            {d.binding_id for d in demands},
            worker_id=EXECUTOR,
        )
        await self.session.flush()
        return True

    async def _replace_demand_terminal_events(
        self,
        demands,
        *,
        event_type: str,
        processed_items: int,
        total_items: int,
        stats: dict,
        worker_id: str,
    ) -> None:
        keys = [f"{event_type}:{demand.id}" for demand in demands]
        if keys:
            await self.session.execute(
                delete(OutboxEvent).where(
                    OutboxEvent.event_type == event_type,
                    OutboxEvent.dedupe_key.in_(keys),
                )
            )
        for demand in demands:
            demand.processed_items = processed_items
            demand.total_items = total_items
            demand.stats = stats
        await finalize_bindings(
            self.session,
            {d.binding_id for d in demands},
            worker_id=worker_id,
        )
        await self.session.flush()

    async def _worker_id(self, attempt_id) -> str:
        attempt = await self.session.get(VkExecutionAttempt, attempt_id)
        return attempt.worker_id if attempt is not None else EXECUTOR
