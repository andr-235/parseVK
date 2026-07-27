import logging
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from typing import Any

from app.domain.ports.vk_api import VkApiPort as VkApiAdapter
from app.domain.repositories.checkpoint import CheckpointData, IngestionCheckpointStore
from app.services.ingestion.post_collector import _author_payload as _make_author_payload

logger = logging.getLogger("vk-service.ingestion")


class CommentCollector:
    def __init__(
        self,
        *,
        adapter: VkApiAdapter,
        repository,
        outbox=None,
        page_committer: Callable[[], Awaitable[None]] | None = None,
    ) -> None:
        self.adapter = adapter
        self.repository = repository
        self.outbox = outbox
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
        correlation_id: str | None = None,
    ) -> int:
        """Collect comments for a post using paginated iteration with per-page checkpoint.

        Returns the number of *newly persisted* (unique) comments collected.
        """
        logger.debug(
            "[collect_for_post] START owner_id=%d post_id=%d start_offset=%d",
            owner_id,
            post_id,
            start_offset,
        )

        persisted_count = 0
        fetched_count = 0
        page_num = 0
        seen_ids: set[int] = set()
        last_comment_id: int | None = None
        last_comment_date: datetime | None = None

        async for page in self.adapter.iter_comment_pages(
            int(owner_id),
            int(post_id),
            start_offset=start_offset,
        ):
                page_num += 1
                page_items = page.get("items") or []

                if not page_items:
                    logger.debug(
                        "Empty comment page for owner_id=%d post_id=%d, done collecting",
                        owner_id,
                        post_id,
                    )
                    break

                for profile in page.get("profiles", []):
                    author_profiles.setdefault(profile["id"], profile)
                for group_profile in page.get("groups", []):
                    author_profiles.setdefault(group_profile["id"], group_profile)

                unique_from_ids = {
                    comment["from_id"]
                    for comment in page_items
                    if comment.get("from_id") is not None
                }
                for from_id in unique_from_ids:
                    payload = _make_author_payload(from_id, author_profiles)
                    await self.repository.upsert_author(payload)
                    if self.outbox:
                        await self.outbox.emit_author_collected(payload)

                for comment in page_items:
                    await self.repository.upsert_comment(comment, task_id=task_run.task_id)
                    if self.outbox:
                        await self.outbox.emit_comment_collected(
                            comment,
                            task_id=task_run.task_id,
                            correlation_id=correlation_id,
                        )
                    fetched_count += 1
                    if comment.get("id") not in seen_ids:
                        persisted_count += 1
                        seen_ids.add(comment["id"])

                page_offset = start_offset + fetched_count
                last_comment = page_items[-1]
                last_comment_id = last_comment.get("id")
                if last_comment.get("date"):
                    last_comment_date = datetime.fromtimestamp(int(last_comment["date"]), tz=UTC)
                else:
                    last_comment_date = None

                logger.debug(
                    "Comment page %d for owner_id=%d post_id=%d: saved %d comments "
                    "(persisted=%d fetched=%d total=%d offset=%d)",
                    page_num,
                    owner_id,
                    post_id,
                    len(page_items),
                    persisted_count,
                    fetched_count,
                    base_processed_comments + persisted_count,
                    page_offset,
                )

                if checkpoint_store is not None:
                    checkpoint = CheckpointData(
                        run_id=task_run.run_id,
                        owner_id=owner_id,
                        post_id=post_id,
                        task_id=task_run.task_id,
                        group_id=group_id,
                        next_offset=page_offset,
                        last_comment_id=last_comment_id,
                        last_comment_date=last_comment_date,
                        processed_comments=base_processed_comments + persisted_count,
                        status="in_progress",
                    )
                    await checkpoint_store.save(checkpoint)

                if self.page_committer is not None:
                    await self.page_committer()

        # Reconcile with DB count to exclude cross-run overlap
        total_in_db = await self.repository.count_comments_for_post(owner_id, post_id)
        actual_new = total_in_db - base_processed_comments
        if actual_new < 0:
            actual_new = 0

        if checkpoint_store is not None:
            checkpoint = CheckpointData(
                run_id=task_run.run_id,
                owner_id=owner_id,
                post_id=post_id,
                task_id=task_run.task_id,
                group_id=group_id,
                next_offset=start_offset + fetched_count,
                last_comment_id=last_comment_id,
                last_comment_date=last_comment_date,
                processed_comments=base_processed_comments + actual_new,
                status="in_progress",
            )
            await checkpoint_store.save(checkpoint)

        logger.info(
            "Collected %d comments for post %d_%d "
            "(fetched=%d, total_in_db=%d, base=%d)",
            actual_new, owner_id, post_id,
            fetched_count, total_in_db, base_processed_comments,
        )
        logger.debug(
            "[collect_for_post] END owner_id=%d post_id=%d collected=%d",
            owner_id,
            post_id,
            actual_new,
        )
        return actual_new

    async def save_comment(
        self,
        comment: dict,
        task_run: Any,
        author_profiles: dict[int, dict],
        *,
        correlation_id: str | None = None,
    ) -> bool:
        author_added = await self._upsert_comment_author(comment, author_profiles)
        await self.repository.upsert_comment(comment, task_id=task_run.task_id)
        if self.outbox:
            await self.outbox.emit_comment_collected(
                comment, task_id=task_run.task_id, correlation_id=correlation_id
            )
        return author_added

    async def _upsert_comment_author(self, comment: dict, profiles: dict[int, dict]) -> bool:
        from_id = comment.get("from_id")
        if from_id is None:
            return False
        payload = _make_author_payload(from_id, profiles)
        await self.repository.upsert_author(payload)
        if self.outbox:
            await self.outbox.emit_author_collected(payload)
        return True
