import asyncio
import logging

from app.modules.notifier.repository import NotifierRepository

logger = logging.getLogger(__name__)

MESSENGERS = ("whatsapp", "max")


class NotifierService:
    def __init__(self, *, repository: NotifierRepository):
        self.repository = repository

    async def get_state(self, user_id: str, messenger: str) -> dict:
        state = await self.repository.get_or_create_state(user_id, messenger)
        return {
            "id": state.id,
            "user_id": state.user_id,
            "messenger": state.messenger,
            "last_seen_message_id": state.last_seen_message_id,
            "updated_at": state.updated_at,
        }

    async def update_cursor(self, user_id: str, messenger: str, last_seen_message_id: int) -> None:
        await self.repository.update_cursor(user_id, messenger, last_seen_message_id)

    async def get_new_messages(self, user_id: str, messenger: str, limit: int = 100) -> list[dict]:
        state = await self.repository.get_or_create_state(user_id, messenger)
        user_keywords = await self._load_user_keywords(user_id, messenger)

        if not user_keywords:
            return []

        since_id = state.last_seen_message_id or 0
        rows = await self.repository.find_new_messages(user_id, messenger, since_id, user_keywords, limit)
        return [_message_to_dict(r) for r in rows]

    async def _load_user_keywords(self, user_id: str, messenger: str) -> list[str]:
        from app.modules.keywords.repository import KeywordsRepository

        kw_repo = KeywordsRepository(self.repository.session)
        keywords = await kw_repo.list_by_user(user_id, messenger)
        return [k.keyword for k in keywords]


async def run_notifier_forever(
    repository: NotifierRepository,
    poll_interval: int = 60,
) -> None:
    logger.info("Notifier background task started (interval=%ds)", poll_interval)
    while True:
        try:
            await _poll_all(repository)
        except Exception as e:
            logger.error("Notifier poll cycle failed: %s", e, exc_info=True)
        await asyncio.sleep(poll_interval)


async def _poll_all(repository: NotifierRepository) -> None:
    for messenger in MESSENGERS:
        try:
            await _poll_messenger(repository, messenger)
        except Exception as e:
            logger.error("Notifier poll %s failed: %s", messenger, e, exc_info=True)


async def _poll_messenger(repository: NotifierRepository, messenger: str) -> None:
    max_id = await repository.get_max_message_id(messenger)
    if max_id == 0:
        return

    user_ids = await repository.list_users_with_keywords(messenger)
    if not user_ids:
        return

    from app.modules.keywords.repository import KeywordsRepository

    kw_repo = KeywordsRepository(repository.session)
    new_count = 0

    for user_id in user_ids:
        state = await repository.get_or_create_state(user_id, messenger)
        since_id = state.last_seen_message_id or 0

        if since_id >= max_id:
            continue

        if since_id == 0:
            await repository.update_cursor(user_id, messenger, max_id)
            continue

        keywords = await kw_repo.list_by_user(user_id, messenger)
        keyword_texts = [k.keyword for k in keywords]
        if not keyword_texts:
            await repository.update_cursor(user_id, messenger, max_id)
            continue

        messages = await repository.find_new_messages(user_id, messenger, since_id, keyword_texts, limit=100)
        if messages:
            new_count += len(messages)

        await repository.update_cursor(user_id, messenger, max_id)

    if new_count > 0:
        logger.info("Notifier %s: %d new messages for %d users", messenger, new_count, len(user_ids))


def _message_to_dict(msg) -> dict:
    return {
        "id": msg.id,
        "messenger": msg.messenger,
        "external_id": msg.external_id,
        "chat_external_id": msg.chat_external_id,
        "chat_name": msg.chat_name,
        "author": msg.author,
        "text": msg.text,
        "content_url": msg.content_url,
        "content_type": msg.content_type,
        "created_at": msg.created_at,
        "ingested_at": msg.ingested_at,
    }
