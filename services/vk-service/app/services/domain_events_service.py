from app.domain.repositories.outbox import OutboxRepository


class OutboxService:
    def __init__(self, repository: OutboxRepository):
        self.repository = repository

    async def emit_group_collected(self, group: dict, *, correlation_id: str | None = None) -> None:
        vk_group_id = int(group["id"])
        await self.repository.add_event(
            event_type="vk.group_collected",
            aggregate_type="vk_group",
            aggregate_id=str(vk_group_id),
            correlation_id=correlation_id,
            payload={"vkGroupId": vk_group_id, "group": group},
        )

    async def emit_group_deleted(self, vk_group_id: int, *, correlation_id: str | None = None) -> None:
        await self.repository.add_event(
            event_type="vk.group_deleted",
            aggregate_type="vk_group",
            aggregate_id=str(vk_group_id),
            correlation_id=correlation_id,
            payload={"vkGroupId": vk_group_id},
        )

    async def emit_post_collected(self, post: dict, *, task_id: int, correlation_id: str | None = None) -> None:
        owner_id = int(post.get("owner_id", 0))
        post_id = int(post.get("id", 0))
        await self.repository.add_event(
            event_type="vk.post_collected",
            aggregate_type="vk_post",
            aggregate_id=f"{owner_id}:{post_id}",
            correlation_id=correlation_id,
            dedupe_key=f"vk.post_collected:{owner_id}:{post_id}",
            payload={"taskId": task_id, "vkOwnerId": owner_id, "vkPostId": post_id, "post": post},
        )

    async def emit_comments_collected_batch(
        self,
        *,
        batch_id: str,
        chunk_index: int,
        chunk_count: int,
        comments: list[dict],
        authors: list[dict],
        owner_id: int,
        post_id: int,
        task_id: int,
        run_id: str | None = None,
        correlation_id: str | None = None,
        source_position: str | None = None,
    ) -> None:
        import json
        payload = {
            "batchId": batch_id,
            "chunkIndex": chunk_index,
            "chunkCount": chunk_count,
            "comments": comments,
            "authors": authors,
            "sourcePosition": source_position,
            "taskId": task_id,
            "runId": run_id,
            "ownerId": owner_id,
            "postId": post_id,
        }
        await self.repository.add_event(
            event_type="vk.comments_collected",
            aggregate_type="vk_comment",
            aggregate_id=f"{owner_id}:{post_id}",
            correlation_id=correlation_id,
            dedupe_key=f"vk.comments_collected:{batch_id}:{chunk_index}",
            event_version=1,
            payload=payload,
        )

    async def emit_task_completed(
        self, *, task_id: int, run_id: str, stats: dict, correlation_id: str | None = None
    ) -> None:
        await self.repository.add_event(
            event_type="vk.task_completed",
            aggregate_type="vk_task",
            aggregate_id=str(task_id),
            correlation_id=correlation_id,
            dedupe_key=f"vk.task_completed:{task_id}:{run_id}",
            payload={"taskId": task_id, "runId": run_id, "stats": stats},
        )

    async def emit_task_failed(
        self, *, task_id: int, run_id: str, error: str, correlation_id: str | None = None
    ) -> None:
        await self.repository.add_event(
            event_type="vk.task_failed",
            aggregate_type="vk_task",
            aggregate_id=str(task_id),
            correlation_id=correlation_id,
            dedupe_key=f"vk.task_failed:{task_id}:{run_id}",
            payload={"taskId": task_id, "runId": run_id, "error": error},
        )
