class OutboxService:
    def __init__(self, repository):
        self.repository = repository

    async def emit_group_collected(self, group: dict, *, correlation_id: str | None = None) -> None:
        vk_group_id = int(group["id"])
        await self.repository.add_event(
            event_type="vk.group_collected",
            aggregate_type="vk_group",
            aggregate_id=str(vk_group_id),
            correlation_id=correlation_id,
            dedupe_key=f"vk.group_collected:{vk_group_id}",
            payload={"vkGroupId": vk_group_id, "group": group},
        )

    async def emit_author_collected(self, author: dict, *, correlation_id: str | None = None) -> None:
        vk_author_id = int(author["vk_author_id"])
        await self.repository.add_event(
            event_type="vk.author_collected",
            aggregate_type="vk_author",
            aggregate_id=str(vk_author_id),
            correlation_id=correlation_id,
            dedupe_key=f"vk.author_collected:{vk_author_id}",
            payload={"vkAuthorId": vk_author_id, "author": author},
        )

    async def emit_post_collected(self, post: dict, *, task_id: int, correlation_id: str | None = None) -> None:
        owner_id = int(post["owner_id"])
        post_id = int(post["id"])
        await self.repository.add_event(
            event_type="vk.post_collected",
            aggregate_type="vk_post",
            aggregate_id=f"{owner_id}:{post_id}",
            correlation_id=correlation_id,
            dedupe_key=f"vk.post_collected:{owner_id}:{post_id}",
            payload={"taskId": task_id, "vkOwnerId": owner_id, "vkPostId": post_id, "post": post},
        )

    async def emit_comment_collected(self, comment: dict, *, task_id: int, correlation_id: str | None = None) -> None:
        owner_id = int(comment["owner_id"])
        post_id = int(comment["post_id"])
        comment_id = int(comment["id"])
        await self.repository.add_event(
            event_type="vk.comment_collected",
            aggregate_type="vk_comment",
            aggregate_id=f"{owner_id}:{post_id}:{comment_id}",
            correlation_id=correlation_id,
            dedupe_key=f"vk.comment_collected:{owner_id}:{post_id}:{comment_id}",
            payload={
                "taskId": task_id,
                "vkOwnerId": owner_id,
                "vkPostId": post_id,
                "vkCommentId": comment_id,
                "comment": comment,
            },
        )

    async def emit_task_progress_updated(
        self,
        *,
        task_id: int,
        run_id: str,
        processed_items: int,
        total_items: int,
        progress: float,
        stats: dict,
        correlation_id: str | None = None,
    ) -> None:
        await self.repository.add_event(
            event_type="vk.task_progress_updated",
            aggregate_type="vk_task",
            aggregate_id=str(task_id),
            correlation_id=correlation_id,
            payload={
                "taskId": task_id,
                "runId": run_id,
                "processedItems": processed_items,
                "totalItems": total_items,
                "progress": progress,
                "stats": stats,
            },
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
