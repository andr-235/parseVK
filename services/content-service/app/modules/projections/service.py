<<<<<<< HEAD
from app.modules.projections.processor import CONSUMER_NAME, ProjectionRepository, VkEvent
=======
from app.modules.projections.processor import CONSUMER_NAME, VkEvent
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da


class ProjectionService:
    def __init__(self, repository, *, consumer_name: str = CONSUMER_NAME):
        self.repository = repository
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
        elif event.event_type == "vk.comment_collected":
            comment = event.payload["comment"]
            await self.repository.upsert_comment(comment, task_id=event.payload.get("taskId"))
            owner_id = comment.get("owner_id", 0)
            post_id = comment.get("post_id", 0)
            await self.repository.increment_post_comments_count(f"{owner_id}:{post_id}")
        await self.repository.mark_processed(self.consumer_name, event.event_id, event.event_type)
        await self.repository.save()
        return True
