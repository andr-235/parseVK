import logging

from app.domain.events.models import (
    VkAuthorPayload,
    VkCommentPayload,
    VkEvent,
    VkGroupDeletedPayload,
    VkGroupPayload,
    VkPostPayload,
)

logger = logging.getLogger(__name__)
CONSUMER_NAME = "content-service.vk"


class VkProjectionService:
    def __init__(self, repository, *, consumer_name: str = CONSUMER_NAME):
        self.repository = repository
        self.consumer_name = consumer_name

    async def handle(self, event: VkEvent) -> bool:
        if await self.repository.is_processed(self.consumer_name, event.event_id):
            logger.info("Duplicate VK event ignored: event_id=%s", event.event_id)
            return False
        payload = event.payload
        if isinstance(payload, VkGroupPayload):
            await self.repository.upsert_group(payload.group)
        elif isinstance(payload, VkGroupDeletedPayload):
            await self.repository.delete_group(payload.vk_group_id)
        elif isinstance(payload, VkAuthorPayload):
            await self.repository.upsert_author(payload.author)
        elif isinstance(payload, VkPostPayload):
            await self.repository.upsert_post(payload.post, task_id=payload.task_id)
        elif isinstance(payload, VkCommentPayload):
            await self.repository.upsert_comment(payload.comment, task_id=payload.task_id)
            owner_id = payload.comment.get("owner_id", 0)
            post_id = payload.comment.get("post_id", 0)
            await self.repository.sync_post_comments_count(f"{owner_id}:{post_id}")
        await self.repository.mark_processed(
            self.consumer_name,
            event.event_id,
            event.event_type,
        )
        return True
