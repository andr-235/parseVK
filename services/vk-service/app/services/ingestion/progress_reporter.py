from datetime import UTC, datetime

from app.services.domain_events_service import OutboxService


class ProgressReporter:
    def __init__(
        self,
        *,
        outbox: OutboxService | None = None,
    ):
        self._outbox = outbox

    async def report(
        self,
        task_id: int,
        run_id: str,
        owner_user_id: str,
        processed: int,
        total: int,
    ) -> None:
        if self._outbox is None:
            return
        progress = processed / total if total > 0 else 0.0
        await self._outbox.emit_execution_progressed(
            task_id=task_id,
            run_id=run_id,
            owner_user_id=owner_user_id,
            executor="vk-service",
            processed_items=processed,
            total_items=total,
            progress=progress,
            occurred_at=datetime.now(UTC).isoformat(),
        )
