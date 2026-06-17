import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from app.clients.tasks.client import TasksClient
from app.core.config import settings
from app.modules.ingestion.processor import process_chat_messages
from app.modules.whappi.client import MaxApiClient, WappiClient

logger = logging.getLogger(__name__)


@dataclass
class IngestionResult:
    messages: int = 0
    groups: int = 0
    errors: list[dict] = field(default_factory=list)

    def stats(self) -> dict[str, int]:
        return {"messages": self.messages, "groups": self.groups, "errors": len(self.errors)}

    @property
    def processed_items(self) -> int:
        return self.messages + self.groups


class IngestionService:
    def __init__(self, *, repository, tasks_client: TasksClient, outbox_service=None):
        self.repository = repository
        self.tasks_client = tasks_client
        self.outbox = outbox_service

    def _get_client(self, messenger: str) -> WappiClient | MaxApiClient:
        if messenger == "max":
            return MaxApiClient()
        return WappiClient()

    async def _fetch_chats(self, client, messenger: str) -> list[dict]:
        import asyncio
        chats = await asyncio.to_thread(client.list_chats)
        return [{"chat_id": c.chat_id, "name": c.name, "raw": c.raw} for c in chats]

    async def _fetch_messages(self, client, chat_id: str, from_ts: int | None) -> list[dict]:
        import asyncio
        return await asyncio.to_thread(client.list_messages, chat_id, time_from=from_ts)

    async def execute(self, task_run: Any, *, correlation_id: str | None = None) -> IngestionResult:
        messenger = task_run.messenger
        if not messenger:
            raise ValueError("messenger is required in task_run")

        result = IngestionResult()
        try:
            group_ids = await self._group_ids(task_run)
            if not group_ids:
                logger.warning("No groups to parse for messenger=%s", messenger)
                return result

            client = self._get_client(messenger)
            outbox = self.outbox

            for chat_id in group_ids:
                try:
                    raw_messages = await self._fetch_messages(client, chat_id, None)
                    processed = await process_chat_messages(
                        messenger, chat_id, raw_messages,
                        include_system=settings.wappi_include_system,
                        upsert_message_fn=lambda md: self.repository.upsert_message(messenger, md),
                        emit_message_collected_fn=(
                            lambda mid: outbox.emit_message_collected(
                                messenger=messenger, message_id=mid,
                                chat_id=chat_id, correlation_id=correlation_id,
                            )
                        ) if outbox else None,
                    )
                    result.messages += processed
                    result.groups += 1
                except Exception as exc:
                    sanitized = str(exc)
                    result.errors.append({"chat_id": chat_id, "error": sanitized})
                    logger.error("Error processing chat %s for %s: %s", chat_id, messenger, sanitized)

            task_run.status = "done"
            task_run.finished_at = datetime.now(UTC)
            task_run.processed_items = result.processed_items
            task_run.total_items = result.processed_items
            task_run.updated_at = datetime.now(UTC)

            await self.tasks_client.complete_execution(
                task_run.task_id, task_run.run_id,
                result.processed_items, result.processed_items, result.stats(),
                request_id=task_run.run_id, correlation_id=correlation_id,
            )
            if self.outbox:
                await self.outbox.emit_task_completed(
                    task_id=task_run.task_id, run_id=task_run.run_id,
                    stats=result.stats(), correlation_id=correlation_id,
                )
            return result

        except Exception as exc:
            sanitized = str(exc)
            logger.exception("Task execution failed for task_id=%s", task_run.task_id)
            task_run.status = "failed"
            task_run.finished_at = datetime.now(UTC)
            task_run.last_error = sanitized
            task_run.updated_at = datetime.now(UTC)

            if self.outbox:
                await self.outbox.emit_task_failed(
                    task_id=task_run.task_id, run_id=task_run.run_id,
                    error=sanitized, correlation_id=correlation_id,
                )
            try:
                await self.tasks_client.fail_execution(
                    task_run.task_id, task_run.run_id, sanitized,
                    task_run.processed_items, task_run.total_items, {},
                    request_id=task_run.run_id, correlation_id=correlation_id,
                )
            except Exception:
                logger.exception("Fail callback error for task_id=%s", task_run.task_id)
            return result

    async def _group_ids(self, task_run: Any) -> list[str]:
        if task_run.scope == "selected" and task_run.group_ids:
            return list(task_run.group_ids)
        return await self.repository.get_active_group_ids(task_run.messenger)
