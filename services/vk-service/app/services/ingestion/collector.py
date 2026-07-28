import logging
from collections.abc import Awaitable, Callable
from typing import Any

from app.domain.ports.vk_api import VkApiPort as VkApiAdapter
from app.domain.repositories.checkpoint import CheckpointData, IngestionCheckpointStore
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
        page_committer: Callable[[], Awaitable[None]] | None = None,
        checkpoint_store: IngestionCheckpointStore | None = None,
    ):
        self.adapter = adapter
        self.repository = repository
        self._on_error = on_error or (lambda msg: msg)
        self.checkpoint_store = checkpoint_store
        self.page_committer = page_committer
        self.current_result = IngestionResult()
        self.progress = ProgressReporter(outbox=outbox)

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
            page_committer=page_committer,
        )

    async def get_group_ids(self, task_run: Any) -> list[int]:
        return await self.group_collector.get_group_ids(task_run)

    async def collect(
        self, task_run: Any, group_ids: list[int], *, correlation_id: str | None = None
    ) -> IngestionResult:
        logger.debug(
            "[collect] START task_id=%s run_id=%s groups=%s",
            getattr(task_run, "task_id", None),
            getattr(task_run, "run_id", None),
            group_ids,
        )
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
                owner_id = int(post["owner_id"])
                post_id = int(post["id"])

                author_added = await self.post_collector.save_post(
                    post,
                    task_run,
                    author_profiles,
                    correlation_id=correlation_id,
                )
                if author_added:
                    result.authors += 1
                result.posts += 1

                start_offset = 0
                cp = None
                if self.checkpoint_store is not None:
                    cp = await self.checkpoint_store.load(task_run.run_id, owner_id, post_id)
                    if cp is not None and cp.status == "completed":
                        result.comments += cp.processed_comments
                        logger.info(
                            "Skipping completed post %d_%d (group_id=%d) — %d comments already counted",
                            owner_id,
                            post_id,
                            group_id,
                            cp.processed_comments,
                        )
                        continue
                    if cp is not None and cp.status == "failed":
                        result.comments += cp.processed_comments
                        logger.warning(
                            "Skipping failed post %d_%d (group_id=%d): %s — %d comments already counted",
                            owner_id,
                            post_id,
                            group_id,
                            cp.last_error,
                            cp.processed_comments,
                        )
                        result.errors.append(
                            {"owner_id": owner_id, "post_id": post_id, "error": cp.last_error}
                        )
                        continue
                    if cp is not None and cp.status == "in_progress":
                        start_offset = cp.next_offset
                        logger.info(
                            "Resuming post %d_%d (group_id=%d) from offset=%d",
                            owner_id,
                            post_id,
                            group_id,
                            start_offset,
                        )

                if self.checkpoint_store is not None and cp is None:
                    await self.checkpoint_store.save(
                        CheckpointData(
                            run_id=task_run.run_id,
                            owner_id=owner_id,
                            post_id=post_id,
                            task_id=task_run.task_id,
                            group_id=group_id,
                            next_offset=0,
                            status="in_progress",
                        )
                    )

                base_processed = cp.processed_comments if cp is not None else 0

                try:
                    count = await self.comment_collector.collect_for_post(
                        owner_id=owner_id,
                        post_id=post_id,
                        author_profiles=author_profiles,
                        task_run=task_run,
                        checkpoint_store=self.checkpoint_store,
                        start_offset=start_offset,
                        group_id=group_id,
                        base_processed_comments=base_processed,
                        correlation_id=correlation_id,
                    )
                    result.comments += base_processed + count
                    if self.checkpoint_store is not None:
                        await self.checkpoint_store.complete(
                            task_run.run_id, owner_id, post_id,
                        )
                    if self.page_committer is not None:
                        await self.page_committer()
                except Exception as error:
                    sanitized_error = self._on_error(str(error))
                    logger.error(
                        "Comment collection failed for post %d_%d (group_id=%d): %s",
                        owner_id,
                        post_id,
                        group_id,
                        sanitized_error,
                    )
                    result.errors.append(
                        {"owner_id": owner_id, "post_id": post_id, "error": sanitized_error}
                    )
                    if self.checkpoint_store is not None:
                        await self.checkpoint_store.fail(
                            task_run.run_id, owner_id, post_id, sanitized_error
                        )
                    if self.page_committer is not None:
                        await self.page_committer()
                    continue

                await self.progress.report(
                    task_id=task_run.task_id,
                    run_id=task_run.run_id,
                    owner_user_id=getattr(task_run, "owner_user_id", None) or "",
                    processed=result.processed_items,
                    total=result.processed_items,
                )

        logger.debug(
            "[collect] END task_id=%s run_id=%s stats=%s",
            getattr(task_run, "task_id", None),
            getattr(task_run, "run_id", None),
            result.stats(),
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
