import logging

from app.domain.content.clients import VkProfilesClient
from app.domain.content.repositories import AuthorRepository

logger = logging.getLogger(__name__)

PROFILE_FIELDS = [
    "about", "activities", "bdate", "career", "city", "contacts", "country",
    "domain", "followers_count", "occupation", "photo_50", "photo_100",
    "photo_200", "screen_name", "status",
]


class AuthorCommandService:
    def __init__(
        self,
        repository: AuthorRepository,
        profiles: VkProfilesClient | None = None,
    ):
        self.repository = repository
        self.profiles = profiles

    async def verify_author(self, vk_author_id: int) -> bool:
        return await self.repository.update_verified_at(vk_author_id)

    async def delete_author(self, vk_author_id: int) -> bool:
        if await self.repository.get_author(vk_author_id) is None:
            return False
        await self.repository.delete_author_and_comments(vk_author_id)
        return True

    async def refresh_authors(self) -> int:
        if self.profiles is None:
            logger.warning("Author refresh skipped: VK profiles client is unavailable")
            return 0
        ids = [value for value in await self.repository.get_all_author_ids() if value > 0]
        updated = 0
        for start in range(0, len(ids), 500):
            chunk = ids[start:start + 500]
            try:
                profiles = await self.profiles.get_profiles(chunk, PROFILE_FIELDS)
                updated += await self.repository.bulk_update_profiles(profiles)
            except Exception as exc:
                logger.warning(
                    "Author refresh chunk failed: start=%d error_type=%s",
                    start,
                    type(exc).__name__,
                )
        logger.info("Author refresh completed: updated=%d", updated)
        return updated
