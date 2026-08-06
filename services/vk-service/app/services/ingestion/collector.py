from collections.abc import Awaitable, Callable
from typing import Any

from app.domain.exceptions.vk_api import VkApiAuthError
from app.domain.ports.vk_api import VkApiPort as VkApiAdapter
from app.domain.repositories.checkpoint import IngestionCheckpointStore
from app.infrastructure.tasks_client.client import TasksClient
from app.services.ingestion.checkpoint_flow import CheckpointFlow
from app.services.ingestion.comment_collector import CommentCollector
from app.services.ingestion.group_collector import GroupCollector
from app.services.ingestion.post_collector import PostCollector
from app.services.ingestion.post_pipeline import PostCollectionPipeline
from app.services.ingestion.profile_enrichment import enrich_user_profiles
from app.services.ingestion.progress_reporter import ProgressReporter
from app.services.ingestion.result import IngestionResult
from app.services.ingestion.staging_writer import PhysicalIngestionStager


class DataCollector:
    def __init__(
        self,
        *,
        adapter: VkApiAdapter,
        repository,
        tasks_client: TasksClient,
        outbox=None,
        staging: PhysicalIngestionStager | None = None,
        require_staging: bool = False,
        on_error: Callable[[str], str] | None = None,
        page_committer: Callable[[], Awaitable[None]] | None = None,
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
        self.checkpoint_flow = CheckpointFlow(
            store=checkpoint_store,
            commit_page=page_committer,
            on_error=self.on_error,
        )
        self.post_pipeline = PostCollectionPipeline(
            post_collector=self.post_collector,
            comment_collector=self.comment_collector,
            checkpoints=self.checkpoint_flow,
            progress=ProgressReporter(demand_fanout=demand_fanout),
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
        result = IngestionResult()
        result.errors = []
        self.current_result = result

        for group_id in group_ids:
            if not await self._collect_group(
                group_id,
                correlation_id,
                result,
            ):
                continue
            profiles: dict[int, dict] = {}
            posts = await self._load_posts(
                group_id,
                task_run,
                profiles,
                correlation_id,
                result,
            )
            if posts is None:
                continue
            await enrich_user_profiles(self.adapter, profiles)
            for post in posts:
                await self.post_pipeline.collect(
                    post=post,
                    task_run=task_run,
                    group_id=group_id,
                    profiles=profiles,
                    result=result,
                    correlation_id=correlation_id,
                )
        return result

    async def _collect_group(
        self,
        group_id: int,
        correlation_id: str | None,
        result: IngestionResult,
    ) -> bool:
        try:
            await self.group_collector.collect_group(
                group_id,
                correlation_id=correlation_id,
            )
        except VkApiAuthError:
            raise
        except Exception as error:
            message = self.on_error(str(error))
            result.errors.append({"group_id": group_id, "error": message})
            return False
        result.groups += 1
        return True

    async def _load_posts(
        self,
        group_id: int,
        task_run: Any,
        profiles: dict[int, dict],
        correlation_id: str | None,
        result: IngestionResult,
    ) -> list[dict] | None:
        try:
            return await self.post_collector.collect_for_group(
                group_id,
                task_run,
                profiles,
                correlation_id=correlation_id,
            )
        except VkApiAuthError:
            raise
        except Exception as error:
            message = self.on_error(str(error))
            result.errors.append({"group_id": group_id, "error": message})
            return None
