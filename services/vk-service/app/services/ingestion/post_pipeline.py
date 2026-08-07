from typing import Any

from app.domain.exceptions.vk_api import VkApiAuthError
from app.domain.repositories.ingestion_parts import (
    IngestionPartConflictError,
    IngestionPartIntegrityError,
)
from app.domain.repositories.ingestion_staging import (
    StagingPayloadConflictError,
    StagingPayloadIntegrityError,
)
from app.services.ingestion.checkpoint_flow import CheckpointFlow
from app.services.ingestion.comment_collector import CommentCollector
from app.services.ingestion.part_authors import PartSourceIntegrityError
from app.services.ingestion.part_errors import OversizedIngestionItemError
from app.services.ingestion.post_collector import PostCollector
from app.services.ingestion.progress_reporter import ProgressReporter
from app.services.ingestion.result import IngestionResult

_TERMINAL_INGESTION_ERRORS = (
    StagingPayloadConflictError,
    StagingPayloadIntegrityError,
    IngestionPartConflictError,
    IngestionPartIntegrityError,
    PartSourceIntegrityError,
    OversizedIngestionItemError,
)


class PostCollectionPipeline:
    def __init__(
        self,
        *,
        post_collector: PostCollector,
        comment_collector: CommentCollector,
        checkpoints: CheckpointFlow,
        progress: ProgressReporter,
    ) -> None:
        self.posts = post_collector
        self.comments = comment_collector
        self.checkpoints = checkpoints
        self.progress = progress

    async def collect(
        self,
        *,
        post: dict,
        task_run: Any,
        group_id: int,
        profiles: dict[int, dict],
        result: IngestionResult,
        remaining_posts: int,
        correlation_id: str | None,
    ) -> None:
        author_added, effective_post = await self.posts.save_post(
            post,
            task_run,
            profiles,
            correlation_id=correlation_id,
        )
        owner_id = int(effective_post["owner_id"])
        post_id = int(effective_post["id"])
        await self.checkpoints.commit()
        result.authors += int(author_added)
        result.posts += 1

        start_offset, checkpoint, done = await self.checkpoints.resume(
            task_run,
            group_id,
            owner_id,
            post_id,
            result,
        )
        if done:
            return
        base_processed = checkpoint.processed_comments if checkpoint else 0

        try:
            count = await self.comments.collect_for_post(
                owner_id=owner_id,
                post_id=post_id,
                post=effective_post,
                author_profiles=profiles,
                task_run=task_run,
                checkpoint_store=self.checkpoints.store,
                start_offset=start_offset,
                group_id=group_id,
                base_processed_comments=base_processed,
                correlation_id=correlation_id,
            )
            result.comments += base_processed + count
            await self.checkpoints.complete(task_run, owner_id, post_id)
        except VkApiAuthError:
            raise
        except _TERMINAL_INGESTION_ERRORS:
            raise
        except Exception as error:
            await self.checkpoints.fail(
                task_run,
                group_id,
                owner_id,
                post_id,
                error,
                result,
            )
            return

        await self.progress.report(
            task_run,
            processed=result.processed_items,
            total=result.processed_items + remaining_posts,
        )
