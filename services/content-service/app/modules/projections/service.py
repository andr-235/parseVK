import logging

from common.events import VkEvent

from app.modules.projections.outbox_service import ContentOutboxService
from app.modules.projections.processor import CONSUMER_NAME

logger = logging.getLogger(__name__)


class ProjectionService:
    def __init__(self, repository, outbox_service: ContentOutboxService | None = None, *, consumer_name: str = CONSUMER_NAME):
        self.repository = repository
        self.outbox_service = outbox_service
        self.consumer_name = consumer_name

    async def handle(self, event: VkEvent) -> bool:
        if await self.repository.is_processed(self.consumer_name, event.event_id):
            return False
        if event.event_type == "vk.group_collected":
            await self.repository.upsert_group(event.payload["group"])
        elif event.event_type == "vk.group_deleted":
            await self.repository.delete_group(event.payload["vkGroupId"])
        elif event.event_type == "vk.author_collected":
            await self.repository.upsert_author(event.payload["author"])
        elif event.event_type == "vk.post_collected":
            await self.repository.upsert_post(event.payload["post"], task_id=event.payload.get("taskId"))
        elif event.event_type == "vk.comments_collected":
            await self._handle_batch_comments(event)
        elif event.event_type == "vk.comment_collected":
            comment = event.payload["comment"]
            await self.repository.upsert_comment(comment, task_id=event.payload.get("taskId"))
            owner_id = comment.get("owner_id", 0)
            post_id = comment.get("post_id", 0)
            await self.repository.increment_post_comments_count(f"{owner_id}:{post_id}")
        await self.repository.mark_processed(self.consumer_name, event.event_id, event.event_type)
        await self.repository.save()
        return True

    async def _handle_batch_comments(self, event: VkEvent) -> None:
        """Handle vk.comments_collected batch event."""
        payload = event.payload
        comments = payload.get("comments", [])
        authors = payload.get("authors", [])
        task_id = payload.get("taskId")

        if not comments and not authors:
            logger.debug("Empty batch eventId=%s, skipping projection", event.event_id)
            return

        # Bulk upsert authors
        author_count = 0
        for author in authors:
            await self.repository.upsert_author(author)
            author_count += 1

        # Bulk upsert comments
        comment_count = 0
        post_keys = set()
        for comment in comments:
            await self.repository.upsert_comment(comment, task_id=task_id)
            comment_count += 1
            owner_id = comment.get("owner_id", 0)
            post_id = comment.get("post_id", 0)
            post_keys.add(f"{owner_id}:{post_id}")

        # Recalculate exact comment counts per post
        for post_key in post_keys:
            exact_count = await self.repository.count_comments_for_post_by_key(post_key)
            await self.repository.set_post_comments_count(post_key, exact_count)

        # Publish projection event (only if rows changed)
        total_count_after = (
            await self.repository.count_comments_for_post_by_key(next(iter(post_keys)))
            if len(post_keys) == 1
            else 0
        )

        if comment_count > 0 or author_count > 0:
            if self.outbox_service:
                projection_payload = {
                    "insertedCount": comment_count,
                    "updatedCount": 0,  # Simplified — actual counts require diff tracking
                    "totalCount": total_count_after,
                    "projectionRevision": 1,
                }
                await self.outbox_service.add_event(
                    event_type="content.comments_projected",
                    aggregate_type="vk_comment",
                    aggregate_id=":".join(sorted(post_keys)) if post_keys else "unknown",
                    payload=projection_payload,
                    correlation_id=event.correlation_id,
                )

        logger.info(
            "Projected batch eventId=%s comments=%d authors=%d posts=%d",
            event.event_id, comment_count, author_count, len(post_keys),
        )
