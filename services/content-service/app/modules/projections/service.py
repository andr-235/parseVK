import logging
from datetime import UTC, datetime

from common.events import VkEvent

from app.core.config import settings
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
        await self.repository.mark_processed(self.consumer_name, event.event_id, event.event_type)
        await self.repository.save()
        return True

    async def _handle_batch_comments(self, event: VkEvent) -> None:
        """Handle vk.comments_collected batch event."""
        payload = event.payload
        comments = payload.get("comments", [])
        authors = payload.get("authors", [])
        task_id = payload.get("taskId")
        run_id = payload.get("runId")
        batch_id = payload.get("batchId")

        if not comments and not authors:
            logger.debug("Empty batch eventId=%s, skipping projection", event.event_id)
            return

        # Collect post keys to determine affected posts
        post_keys = set()
        for comment in comments:
            owner_id = comment.get("owner_id", 0)
            post_id = comment.get("post_id", 0)
            post_keys.add(f"{owner_id}:{post_id}")

        # Pre-query existing comment IDs for affected posts to distinguish inserts from updates
        existing_ids = set()
        for post_key in post_keys:
            ids = await self.repository.get_comment_ids_for_post(post_key)
            existing_ids.update(ids)

        # Count actual inserts vs updates
        incoming_ids = {c.get("id") for c in comments if c.get("id") is not None}
        new_ids = incoming_ids - existing_ids
        inserted_count = len(new_ids)
        updated_count = len(comments) - inserted_count

        # Bulk upsert authors
        author_count = 0
        for author in authors:
            await self.repository.upsert_author(author)
            author_count += 1

        # Bulk upsert comments
        for comment in comments:
            await self.repository.upsert_comment(comment, task_id=task_id)

        # Recalculate exact comment counts per post
        for post_key in post_keys:
            exact_count = await self.repository.count_comments_for_post_by_key(post_key)
            await self.repository.set_post_comments_count(post_key, exact_count)

        # Get owner_id and post_id from the batch (first comment or payload)
        owner_id = payload.get("ownerId")
        post_id = payload.get("postId")
        if owner_id is None and comments:
            owner_id = comments[0].get("owner_id")
        if post_id is None and comments:
            post_id = comments[0].get("post_id")

        total_count_after = (
            await self.repository.count_comments_for_post_by_key(next(iter(post_keys)))
            if len(post_keys) == 1
            else 0
        )

        if inserted_count > 0 or updated_count > 0 or author_count > 0:
            if self.outbox_service and settings.content_projection_events_enabled:
                # Get the post key for monotonic revision tracking
                post_key = next(iter(post_keys)) if post_keys else None
                projection_revision = await self.repository.increment_projection_revision(post_key) if post_key else 1
                projection_payload = {
                    "insertedCount": inserted_count,
                    "updatedCount": updated_count,
                    "totalCount": total_count_after,
                    "projectionRevision": projection_revision,
                    "taskId": task_id,
                    "runId": run_id,
                    "ownerId": owner_id,
                    "postId": post_id,
                    "batchId": batch_id,
                    "projectedAt": datetime.now(UTC).isoformat(),
                }
                await self.outbox_service.add_event(
                    event_type="content.comments_projected",
                    aggregate_type="vk_comment",
                    aggregate_id=":".join(sorted(post_keys)) if post_keys else "unknown",
                    payload=projection_payload,
                    correlation_id=event.correlation_id,
                )

        logger.info(
            "Projected batch eventId=%s comments=%d (inserted=%d, updated=%d) authors=%d posts=%s",
            event.event_id, len(comments), inserted_count, updated_count, author_count, post_keys,
        )

