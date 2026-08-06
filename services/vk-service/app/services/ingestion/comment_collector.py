import logging
from collections.abc import Awaitable, Callable
from datetime import datetime
from typing import Any

from app.domain.ports.vk_api import VkApiPort as VkApiAdapter
from app.domain.repositories.checkpoint import CheckpointData, IngestionCheckpointStore
from app.services.ingestion.author_payload import author_payload
from app.services.ingestion.comment_values import comment_date
from app.services.ingestion.staging_writer import PhysicalIngestionStager

logger = logging.getLogger("vk-service.ingestion")


class CommentCollector:
    def __init__(
        self,
        *,
        adapter: VkApiAdapter,
        repository,
        staging: PhysicalIngestionStager | None = None,
        require_staging: bool = False,
        page_committer: Callable[[], Awaitable[None]] | None = None,
    ) -> None:
        self.adapter, self.repository = adapter, repository
        self.staging = staging
        self.require_staging = require_staging
        self.page_committer = page_committer

    async def collect_for_post(
        self,
        owner_id: int,
        post_id: int,
        author_profiles: dict[int, dict],
        task_run: Any,
        checkpoint_store: IngestionCheckpointStore | None,
        start_offset: int = 0,
        group_id: int = 0,
        base_processed_comments: int = 0,
        *,
        post: dict | None = None,
        correlation_id: str | None = None,
    ) -> int:
        if self.require_staging and self.staging is None:
            raise RuntimeError("durable comment staging requires a fenced execution")
        if self.staging is not None and post is None:
            raise RuntimeError("durable comment staging requires the post snapshot")
        post_snapshot = post or {"owner_id": owner_id, "id": post_id}
        fetched_count = 0
        last_comment_id: int | None = None
        last_comment_date: datetime | None = None

        async for page in self.adapter.iter_comment_pages(
            int(owner_id),
            int(post_id),
            start_offset=start_offset,
        ):
            page_items = page.get("items") or []
            if not page_items:
                break

            page_offset = start_offset + fetched_count
            next_offset = page_offset + len(page_items)
            if self.staging is not None:
                await self.staging.stage_comment_page(
                    post=post_snapshot,
                    page=page,
                    page_offset=page_offset,
                    next_offset=next_offset,
                )

            self._merge_profiles(author_profiles, page)
            unique_from_ids = {
                int(comment["from_id"])
                for comment in page_items
                if comment.get("from_id") is not None
            }
            for from_id in sorted(unique_from_ids):
                await self.repository.upsert_author(
                    author_payload(from_id, author_profiles)
                )
            for comment in page_items:
                await self.repository.upsert_comment(
                    comment,
                    task_id=task_run.task_id,
                )

            fetched_count += len(page_items)
            last_comment = page_items[-1]
            last_comment_id = last_comment.get("id")
            last_comment_date = comment_date(last_comment)
            total_in_db = await self.repository.count_comments_for_post(
                owner_id,
                post_id,
            )
            if checkpoint_store is not None:
                await checkpoint_store.save(
                    CheckpointData(
                        run_id=task_run.run_id,
                        owner_id=owner_id,
                        post_id=post_id,
                        task_id=task_run.task_id,
                        group_id=group_id,
                        next_offset=next_offset,
                        last_comment_id=last_comment_id,
                        last_comment_date=last_comment_date,
                        processed_comments=total_in_db,
                        status="in_progress",
                    )
                )
            if self.page_committer is not None:
                await self.page_committer()

        total_in_db = await self.repository.count_comments_for_post(
            owner_id,
            post_id,
        )
        actual_new = max(0, total_in_db - base_processed_comments)
        if checkpoint_store is not None:
            await checkpoint_store.save(
                CheckpointData(
                    run_id=task_run.run_id,
                    owner_id=owner_id,
                    post_id=post_id,
                    task_id=task_run.task_id,
                    group_id=group_id,
                    next_offset=start_offset + fetched_count,
                    last_comment_id=last_comment_id,
                    last_comment_date=last_comment_date,
                    processed_comments=total_in_db,
                    status="in_progress",
                )
            )
        logger.info(
            "Collected %d comments for post %d_%d",
            actual_new,
            owner_id,
            post_id,
        )
        return actual_new

    @staticmethod
    def _merge_profiles(
        author_profiles: dict[int, dict],
        page: dict,
    ) -> None:
        for profile in page.get("profiles", []):
            author_profiles.setdefault(int(profile["id"]), profile)
        for group in page.get("groups", []):
            author_profiles.setdefault(int(group["id"]), group)
