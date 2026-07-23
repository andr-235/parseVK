import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class OutboxService:
    def __init__(self, repository):
        self.repository = repository

    async def emit_message_collected(
        self, *, messenger: str, message_id: str, chat_id: str,
        chat_name: str | None = None,
        author_id: str | None = None,
        author_name: str | None = None,
        text: str | None = None,
        content_url: str | None = None,
        content_type: str | None = None,
        created_at: datetime | None = None,
        raw: dict | None = None,
        correlation_id: str | None = None,
        replay: bool = False,
        event_version: int = 1,
    ) -> None:
        if replay:
            dedupe_key = f"replay-v2:im.message_collected:{messenger}:{chat_id}:{message_id}"
            logger.debug("Replay emit: messenger=%s message_id=%s dedupe_key=%s", messenger, message_id, dedupe_key)
        else:
            dedupe_key = f"im.message_collected:{messenger}:{chat_id}:{message_id}"

        if event_version == 2:
            # Explicit v2: skip heuristic, always build full payload
            payload = {
                "messenger": messenger,
                "messageId": message_id,
                "chatId": chat_id,
                "chatName": chat_name,
                "authorId": author_id,
                "authorName": author_name,
                "text": text,
                "contentUrl": content_url,
                "contentType": content_type,
                "createdAt": created_at.isoformat() if created_at else None,
                "metadata": raw,
            }
            payload = {k: v for k, v in payload.items() if v is not None}
            logger.debug(
                "Emitting im.message_collected v2 (explicit): messenger=%s message_id=%s event_version=%d",
                messenger, message_id, event_version,
            )
        else:
            # v1: heuristic — v2 only if extras exist, otherwise v1 minimal
            has_extra = any(v is not None for v in (chat_name, author_id, author_name, text, content_url, content_type, created_at))
            if has_extra:
                payload = {
                    "messenger": messenger,
                    "messageId": message_id,
                    "chatId": chat_id,
                    "chatName": chat_name,
                    "authorId": author_id,
                    "authorName": author_name,
                    "text": text,
                    "contentUrl": content_url,
                    "contentType": content_type,
                    "createdAt": created_at.isoformat() if created_at else None,
                    "metadata": raw,
                }
                payload = {k: v for k, v in payload.items() if v is not None}
                event_version = 2  # upgrade to v2
                logger.debug(
                    "Emitting im.message_collected v2 (heuristic): messenger=%s message_id=%s",
                    messenger, message_id,
                )
            else:
                # v1 compatible: minimal payload with 3 fields
                payload = {"messenger": messenger, "messageId": message_id, "chatId": chat_id}
                logger.debug(
                    "Emitting im.message_collected v1: messenger=%s message_id=%s",
                    messenger, message_id,
                )

        logger.info("Emitting im.message_collected v%d for %s:%s:%s", event_version, messenger, chat_id, message_id)
        await self.repository.add_event(
            event_type="im.message_collected",
            aggregate_type="im_message",
            aggregate_id=f"{messenger}:{chat_id}:{message_id}",
            correlation_id=correlation_id,
            dedupe_key=dedupe_key,
            event_version=event_version,
            payload=payload,
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
