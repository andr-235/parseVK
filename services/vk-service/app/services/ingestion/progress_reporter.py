from datetime import UTC, datetime


class ProgressReporter:
    def __init__(self, *, demand_fanout=None):
        self._demand_fanout = demand_fanout

    async def report(
        self,
        task_run,
        processed: int,
        total: int,
    ) -> None:
        if self._demand_fanout is None:
            return
        await self._demand_fanout.report_progress(
            task_run,
            processed_items=processed,
            total_items=total,
            occurred_at=datetime.now(UTC).isoformat(),
        )
