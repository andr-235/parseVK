import logging
from collections.abc import Awaitable, Callable
from typing import Any

from app.domain.ports.vk_api import VkApiPort as VkApiAdapter
from app.infrastructure.tasks_client.client import TasksClient
from app.services.ingestion.comment_collector import CommentCollector
from app.services.ingestion.group_collector import GroupCollector
from app.services.ingestion.post_collector import PostCollector
from app.services.ingestion.progress_reporter import ProgressReporter
from app.services.ingestion.result import IngestionResult

logger = logging.getLogger("vk-service.ingestion")


class DataCollector:
    def __init__(
        self,
        *,
        adapter: VkApiAdapter,
        repository,
        tasks_client: TasksClient,
        outbox=None,
        on_error: Callable[[str], str] | None = None,
        checkpoint: Callable[[], Awaitable[None]] | None = None,
    ):
        self.adapter = adapter
        self.repository = repository
        self._on_error = on_error or (lambda msg: msg)
        self.current_result = IngestionResult()
        self.progress = ProgressReporter(
            tasks_client=tasks_client,
            outbox=outbox,
            checkpoint=checkpoint,
        )

        self.group_collector = GroupCollector(
            adapter=adapter,
            repository=repository,
            tasks_client=tasks_client,
            outbox=outbox,
        )
        self.post_collector = PostCollector(
            adapter=adapter,
            repository=repository,
            outbox=outbox,
        )
        self.comment_collector = CommentCollector(
            adapter=adapter,
            repository=repository,
            outbox=outbox,
        )

    async def get_group_ids(self, task_run: Any) -> list[int]:
        return await self.group_collector.get_group_ids(task_run)

    async def collect(
        self, task_run: Any, group_ids: list[int], *, correlation_id: str | None = None
    ) -> IngestionResult:
        result = IngestionResult()
        result.errors = []
        self.current_result = result

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
                    group_id,
                    task_run,
                    author_profiles,
                    correlation_id=correlation_id,
                )
            except Exception as error:
                sanitized_error = self._on_error(str(error))
                result.errors.append({"group_id": group_id, "error": sanitized_error})
                continue

            await self._enrich_user_profiles(author_profiles)

            for post in posts:
                author_added = await self.post_collector.save_post(
                    post,
                    task_run,
                    author_profiles,
                    correlation_id=correlation_id,
                )
                if author_added:
                    result.authors += 1
                result.posts += 1

                post_comments = await self.comment_collector.collect_for_post(
                    int(post["owner_id"]),
                    int(post["id"]),
                    author_profiles,
                    correlation_id=correlation_id,
                )

                for comment in post_comments:
                    author_added = await self.comment_collector.save_comment(
                        comment,
                        task_run,
                        author_profiles,
                        correlation_id=correlation_id,
                    )
                    if author_added:
                        result.authors += 1
                    result.comments += 1

                await self.progress.report(task_run, result, correlation_id)

            if not posts:
                await self.progress.checkpoint()

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
