from dataclasses import dataclass
from typing import Any

from app.clients.tasks.client import TasksClient
from app.modules.vk_api.client import VkApiAdapter


@dataclass
class IngestionResult:
    groups: int = 0
    posts: int = 0
    comments: int = 0
    authors: int = 0

    def stats(self) -> dict[str, int]:
        return {
            "groups": self.groups,
            "posts": self.posts,
            "comments": self.comments,
            "authors": self.authors,
        }

    @property
    def processed_items(self) -> int:
        return self.groups + self.posts + self.comments


class IngestionService:
    def __init__(self, *, adapter: VkApiAdapter, repository, tasks_client: TasksClient, outbox_service=None):
        self.adapter = adapter
        self.repository = repository
        self.tasks_client = tasks_client
        self.outbox = outbox_service

    async def execute(self, task_run: Any, *, correlation_id: str | None = None) -> IngestionResult:
        try:
            group_ids = self._group_ids(task_run)
            result = await self._collect(task_run, group_ids, correlation_id=correlation_id)
            await self.tasks_client.complete_execution(
                task_run.task_id,
                task_run.run_id,
                result.processed_items,
                result.processed_items,
                result.stats(),
                request_id=task_run.run_id,
                correlation_id=correlation_id,
            )
            if self.outbox:
                await self.outbox.emit_task_completed(
                    task_id=task_run.task_id,
                    run_id=task_run.run_id,
                    stats=result.stats(),
                    correlation_id=correlation_id,
                )
            return result
        except Exception as exc:
            if self.outbox:
                await self.outbox.emit_task_failed(
                    task_id=task_run.task_id,
                    run_id=task_run.run_id,
                    error=str(exc),
                    correlation_id=correlation_id,
                )
            await self.tasks_client.fail_execution(
                task_run.task_id,
                task_run.run_id,
                str(exc),
                getattr(task_run, "processed_items", 0),
                getattr(task_run, "total_items", 0),
                {},
                request_id=task_run.run_id,
                correlation_id=correlation_id,
            )
            raise

    def _group_ids(self, task_run: Any) -> list[int]:
        if task_run.scope == "selected":
            return [int(item) for item in task_run.group_ids]
        raise RuntimeError("No group source configured for scope=all")

    async def _collect(
        self, task_run: Any, group_ids: list[int], *, correlation_id: str | None = None
    ) -> IngestionResult:
        result = IngestionResult()
        groups = await self.adapter.get_groups(group_ids)
        for group in groups:
            group_id = int(group["id"])
            await self.repository.upsert_group(group)
            if self.outbox:
                await self.outbox.emit_group_collected(group, correlation_id=correlation_id)
            result.groups += 1

            posts = await self.adapter.get_posts(group_id, mode=task_run.mode, post_limit=task_run.post_limit)
            for post in posts:
                if await self._upsert_post_author(post):
                    result.authors += 1
                await self.repository.upsert_post(post, task_id=task_run.task_id, group_id=group_id)
                if self.outbox:
                    await self.outbox.emit_post_collected(post, task_id=task_run.task_id, correlation_id=correlation_id)
                result.posts += 1

                comments = await self.adapter.get_comments(int(post["owner_id"]), int(post["id"]))
                for comment in comments:
                    if await self._upsert_comment_author(comment):
                        result.authors += 1
                    await self.repository.upsert_comment(comment, task_id=task_run.task_id)
                    if self.outbox:
                        await self.outbox.emit_comment_collected(
                            comment, task_id=task_run.task_id, correlation_id=correlation_id
                        )
                    result.comments += 1

                await self.tasks_client.update_progress(
                    task_run.task_id,
                    task_run.run_id,
                    result.processed_items,
                    result.processed_items,
                    1,
                    result.stats(),
                    request_id=task_run.run_id,
                    correlation_id=correlation_id,
                )
                if self.outbox:
                    await self.outbox.emit_task_progress_updated(
                        task_id=task_run.task_id,
                        run_id=task_run.run_id,
                        processed_items=result.processed_items,
                        total_items=result.processed_items,
                        progress=1,
                        stats=result.stats(),
                        correlation_id=correlation_id,
                    )
        return result

    async def _upsert_post_author(self, post: dict) -> bool:
        from_id = post.get("from_id")
        if from_id is None:
            return False
        await self.repository.upsert_author(
            self._author_payload(from_id)
        )
        if self.outbox:
            await self.outbox.emit_author_collected(self._author_payload(from_id))
        return True

    async def _upsert_comment_author(self, comment: dict) -> bool:
        from_id = comment.get("from_id")
        if from_id is None:
            return False
        await self.repository.upsert_author(
            self._author_payload(from_id)
        )
        if self.outbox:
            await self.outbox.emit_author_collected(self._author_payload(from_id))
        return True

    def _author_payload(self, from_id) -> dict:
        return {
            "vk_author_id": int(from_id),
            "type": "group" if int(from_id) < 0 else "user",
            "display_name": str(from_id),
            "raw": {"from_id": from_id},
        }
