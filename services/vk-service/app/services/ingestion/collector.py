from collections.abc import Awaitable, Callable
from typing import Any

from app.domain.ports.vk_api import VkApiPort as VkApiAdapter
from app.domain.repositories.checkpoint import IngestionCheckpointStore
from app.infrastructure.tasks_client.client import TasksClient
from app.services.ingestion.checkpoint_flow import CheckpointFlow
from app.services.ingestion.comment_collector import CommentCollector
from app.services.ingestion.group_collection_loader import GroupCollectionLoader
from app.services.ingestion.group_collector import GroupCollector
from app.services.ingestion.post_collector import PostCollector
from app.services.ingestion.post_pipeline import PostCollectionPipeline
from app.services.ingestion.prepared_stager import PreparedPhysicalIngestionStager
from app.services.ingestion.profile_enrichment import enrich_user_profiles
from app.services.ingestion.progress_reporter import ProgressReporter
from app.services.ingestion.result import IngestionResult


class DataCollector:
    def __init__(
        self,
        *,
        adapter: VkApiAdapter,
        repository,
        tasks_client: TasksClient,
        outbox=None,
        staging: PreparedPhysicalIngestionStager | None = None,
        require_staging: bool = False,
        on_error: Callable[[str], str] | None = None,
        page_committer: Callable[[], Awaitable[None]] | None = None,
        page_rollback: Callable[[], Awaitable[None]] | None = None,
        checkpoint_store: IngestionCheckpointStore | None = None,
        demand_fanout=None,
    ) -> None:
        self.adapter = adapter
        self.on_error = on_error or (lambda message: message)
        self.current_result = IngestionResult()
        self.group_collector = GroupCollector(
            adapter=adapter,
            repository=repository,
            outbox=outbox,
        )
        self.post_collector = PostCollector(
            adapter=adapter,
            repository=repository,
            staging=staging,
            require_staging=require_staging,
        )
        self.comment_collector = CommentCollector(
            adapter=adapter,
            repository=repository,
            staging=staging,
            require_staging=require_staging,
            page_committer=page_committer,
        )
        checkpoints = CheckpointFlow(
            store=checkpoint_store,
            commit_page=page_committer,
            rollback_page=page_rollback,
            on_error=self.on_error,
        )
        self.post_pipeline = PostCollectionPipeline(
            post_collector=self.post_collector,
            comment_collector=self.comment_collector,
            checkpoints=checkpoints,
            progress=ProgressReporter(demand_fanout=demand_fanout),
        )
        self._group_loader = GroupCollectionLoader(
            group_collector=self.group_collector,
            post_collector=self.post_collector,
            on_error=self.on_error,
        )

    async def get_group_ids(self, task_run: Any) -> list[int]:
        return await self.group_collector.get_group_ids(task_run)

    async def collect(
        self,
        task_run: Any,
        group_ids: list[int],
        *,
        correlation_id: str | None = None,
    ) -> IngestionResult:
        result = IngestionResult(errors=[])
        self.current_result = result

        for group_id in group_ids:
            accepted = await self._group_loader.collect_group(
                group_id,
                correlation_id,
                result,
            )
            if not accepted:
                continue
            profiles: dict[int, dict] = {}
            posts = await self._group_loader.load_posts(
                group_id,
                task_run,
                profiles,
                correlation_id,
                result,
            )
            if posts is None:
                continue
            await enrich_user_profiles(self.adapter, profiles)
            total_posts = len(posts)
            for post_index, post in enumerate(posts):
                await self.post_pipeline.collect(
                    post=post,
                    task_run=task_run,
                    group_id=group_id,
                    profiles=profiles,
                    result=result,
                    remaining_posts=total_posts - post_index - 1,
                    correlation_id=correlation_id,
                )
        return result
