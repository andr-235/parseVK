import logging

from app.domain.events.models import ImEvent, ImGroupPayload, ImMessagePayload

logger = logging.getLogger(__name__)
CONSUMER_NAME = "content-service.im"


class ImProjectionService:
    def __init__(self, repository, *, consumer_name: str = CONSUMER_NAME):
        self.repository = repository
        self.consumer_name = consumer_name

    async def handle(self, event: ImEvent) -> bool:
        if await self.repository.is_processed(self.consumer_name, event.event_id):
            logger.info("Duplicate IM event ignored: event_id=%s", event.event_id)
            return False
        payload = event.payload
        if isinstance(payload, ImMessagePayload):
            await self.repository.upsert_message(
                payload.messenger,
                payload.message_id,
                payload.chat_id,
            )
        elif isinstance(payload, ImGroupPayload):
            logger.info(
                "IM group event observed: messenger=%s chat_id=%s",
                payload.messenger,
                payload.chat_id,
            )
        await self.repository.mark_processed(
            self.consumer_name,
            event.event_id,
            event.event_type,
        )
        return True
