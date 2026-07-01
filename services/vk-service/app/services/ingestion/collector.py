import logging
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from app.domain.ports.vk_api import VkApiPort as VkApiAdapter
from app.infrastructure.tasks_client.client import TasksClient
from app.services.ingestion.comment_collector import CommentCollector
from app.services.ingestion.group_collector import GroupCollector
from app.services.ingestion.post_collector import PostCollector

logger = logging.getLogger("vk-service.ingestion")


@dataclass
class IngestionResult:
    groups: int = 0
    posts: int = 0
    comments: int = 0
    authors: int = 0
    errors: list[dict] | None = None

    def stats(self) -> dict[str, int]:
        return {
            "groups": self.groups,
            "posts": self.posts,
            "comments": self.comments,
            "authors": self.authors,
            "errors": len(self.errors) if self.errors else 0,
        }

    @property
    def processed_items(self) -> int:
        return self.groups + self.posts + self.comments


class DataCollector:
    def __init__(
        self,
        *,
        adapter: VkApiAdapter,
        repository,
        tasks_client: TasksClient,
        outbox=None,
        on_error: Callable[[str], str] | None = None,
    ):
        self.adapter = adapter
        self.repository = repository
        self.tasks_client = tasks_client
        self.outbox = outbox
        self._on_error = on_error or (lambda msg: msg)

        self.group_collector = GroupCollector(
            adapter=adapter, repository=repository, tasks_client=tasks_client, outbox=outbox,
        )
        self.post_collector = PostCollector(
            adapter=adapter, repository=repository, outbox=outbox,
        )
        self.comment_collector = CommentCollector(
            adapter=adapter, repository=repository, outbox=outbox,
        )

    async def get_group_ids(self, task_run: Any) -> list[int]:
        return await self.group_collector.get_group_ids(task_run)

    async def collect(
        self, task_run: Any, group_ids: list[int], *, correlation_id: str | None = None
    ) -> IngestionResult:
        result = IngestionResult()
        result.errors = []

        for group_id in group_ids:
            try:
                await self.group_collector.collect_group(group_id, correlation_id=correlation_id)
            except Exception as error:
                sanitized_error = self._on_error(str(error))
                result.errors.append({"group_id": group_id, "error": sanitized_error})
                continue
            result.groups += 1

            try:
                author_profiles: dict[int, dict] = {}
                posts = await self.post_collector.collect_for_group(
                    group_id, task_run, author_profiles, correlation_id=correlation_id,
                )
            except Exception as error:
                sanitized_error = self._on_error(str(error))
                result.errors.append({"group_id": group_id, "error": sanitized_error})
                continue

            await self._enrich_user_profiles(author_profiles)

            for post in posts:
                author_added = await self.post_collector.save_post(
                    post, task_run, author_profiles, correlation_id=correlation_id,
                )
                if author_added:
                    result.authors += 1
                result.posts += 1

                post_comments = await self.comment_collector.collect_for_post(
                    int(post["owner_id"]), int(post["id"]), author_profiles,
                    correlation_id=correlation_id,
                )

                for comment in post_comments:
                    author_added = await self.comment_collector.save_comment(
                        comment, task_run, author_profiles, correlation_id=correlation_id,
                    )
                    if author_added:
                        result.authors += 1
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

    async def _enrich_user_profiles(self, profiles: dict[int, dict]) -> None:
        user_ids_without_photo = [
            user_id for user_id in profiles if user_id > 0 and not profiles[user_id].get("photo_50")
        ]
        if not user_ids_without_photo:
            return
        try:
            enriched_users = await self.adapter.get_users(
                user_ids_without_photo,
                fields=["photo_50", "photo_100", "photo_200", "domain", "screen_name"],
            )
        except Exception:
            return
        for user in enriched_users:
            user_id = user.get("id")
            if user_id and user_id in profiles:
                profiles[user_id].update(user)
