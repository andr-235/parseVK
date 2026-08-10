from common.events import VkEvent

from app.modules.projections.processor import CONSUMER_NAME


class ProjectionService:
    """Legacy projection path retained only for unrelated group/author events."""

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
        else:
            return False
        await self.repository.mark_processed(
            self.consumer_name,
            event.event_id,
            event.event_type,
        )
        await self.repository.save()
        return True
