class OutboxService:
    def __init__(self, repository):
        self.repository = repository

    async def emit_message_collected(
        self, *, messenger: str, message_id: str, chat_id: str,
        correlation_id: str | None = None,
    ) -> None:
        dedupe_key = f"im.message_collected:{messenger}:{chat_id}:{message_id}"
        await self.repository.add_event(
            event_type="im.message_collected",
            aggregate_type="im_message",
            aggregate_id=f"{messenger}:{chat_id}:{message_id}",
            correlation_id=correlation_id,
            dedupe_key=dedupe_key,
            payload={"messenger": messenger, "messageId": message_id, "chatId": chat_id},
        )

    async def emit_group_collected(
        self, *, messenger: str, chat_id: str,
        correlation_id: str | None = None,
    ) -> None:
        dedupe_key = f"im.group_collected:{messenger}:{chat_id}"
        await self.repository.add_event(
            event_type="im.group_collected",
            aggregate_type="im_group",
            aggregate_id=f"{messenger}:{chat_id}",
            correlation_id=correlation_id,
            dedupe_key=dedupe_key,
            payload={"messenger": messenger, "chatId": chat_id},
        )

    async def emit_task_progress_updated(
        self, *, task_id: int, run_id: str,
        processed_items: int, total_items: int, progress: float,
        stats: dict, correlation_id: str | None = None,
    ) -> None:
        await self.repository.add_event(
            event_type="im.task_progress_updated",
            aggregate_type="im_task",
            aggregate_id=str(task_id),
            correlation_id=correlation_id,
            payload={
                "taskId": task_id, "runId": run_id,
                "processedItems": processed_items, "totalItems": total_items,
                "progress": progress, "stats": stats,
            },
        )

    async def emit_task_completed(
        self, *, task_id: int, run_id: str, stats: dict,
        correlation_id: str | None = None,
    ) -> None:
        dedupe_key = f"im.task_completed:{task_id}:{run_id}"
        await self.repository.add_event(
            event_type="im.task_completed",
            aggregate_type="im_task",
            aggregate_id=str(task_id),
            correlation_id=correlation_id,
            dedupe_key=dedupe_key,
            payload={"taskId": task_id, "runId": run_id, "stats": stats},
        )

    async def emit_task_failed(
        self, *, task_id: int, run_id: str, error: str,
        correlation_id: str | None = None,
    ) -> None:
        dedupe_key = f"im.task_failed:{task_id}:{run_id}"
        await self.repository.add_event(
            event_type="im.task_failed",
            aggregate_type="im_task",
            aggregate_id=str(task_id),
            correlation_id=correlation_id,
            dedupe_key=dedupe_key,
            payload={"taskId": task_id, "runId": run_id, "error": error},
        )
