import logging
from typing import Any

from app.domain.ports.vk_api import VkApiPort as VkApiAdapter

logger = logging.getLogger("vk-service.ingestion")


class PostCollector:
    def __init__(
        self,
        *,
        adapter: VkApiAdapter,
        repository,
        outbox=None,
    ) -> None:
        self.adapter = adapter
        self.repository = repository
        self.outbox = outbox

    async def collect_for_group(
        self,
        group_id: int,
        task_run: Any,
        author_profiles: dict[int, dict],
        *,
        correlation_id: str | None = None,
    ) -> list[dict]:
        posts_response = await self.adapter.get_posts(
            group_id, mode=task_run.mode, post_limit=task_run.post_limit
        )
        posts = posts_response["items"]

        for profile in posts_response.get("profiles", []):
            author_profiles.setdefault(profile["id"], profile)
        for group_profile in posts_response.get("groups", []):
            author_profiles.setdefault(group_profile["id"], group_profile)

        valid_posts: list[dict] = []
        for post in posts:
            owner_id = post.get("owner_id")
            post_id = post.get("id")
            if owner_id is None or post_id is None:
                logger.warning("Skipping post without owner_id or id: %s", post.get("id"))
                continue
            valid_posts.append(post)

        posts = valid_posts
        return posts

    async def save_post(
        self,
        post: dict,
        task_run: Any,
        author_profiles: dict[int, dict],
        *,
        correlation_id: str | None = None,
    ) -> bool:
        author_added = await self._upsert_post_author(post, author_profiles)
        await self.repository.upsert_post(post, task_id=task_run.task_id, group_id=post.get("owner_id"))
        if self.outbox:
            await self.outbox.emit_post_collected(
                post, task_id=task_run.task_id, correlation_id=correlation_id
            )
        return author_added

    async def _upsert_post_author(self, post: dict, profiles: dict[int, dict]) -> bool:
        from_id = post.get("from_id")
        if from_id is None:
            return False
        payload = _author_payload(from_id, profiles)
        await self.repository.upsert_author(payload)
        if self.outbox:
            await self.outbox.emit_author_collected(payload)
        return True


def _author_payload(from_id: int, profiles: dict[int, dict] | None = None) -> dict:
    author_vk_id = int(from_id)
    profile = profiles.get(author_vk_id) if profiles else None
    if profile is None and author_vk_id < 0:
        profile = profiles.get(abs(author_vk_id)) if profiles else None
    if profile:
        display_name = (
            profile.get("name")
            or f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip()
            or str(author_vk_id)
        )
        return {
            "vk_author_id": author_vk_id,
            "type": "group" if author_vk_id < 0 else "user",
            "display_name": display_name,
            "first_name": profile.get("first_name", ""),
            "last_name": profile.get("last_name", ""),
            "photo_50": profile.get("photo_50") or profile.get("photo"),
            "photo_100": profile.get("photo_100") or profile.get("photo"),
            "photo_200": profile.get("photo_200") or profile.get("photo"),
            "domain": profile.get("domain", ""),
            "screen_name": profile.get("screen_name", ""),
            "raw": {"from_id": from_id},
        }
    return {
        "vk_author_id": author_vk_id,
        "type": "group" if author_vk_id < 0 else "user",
        "display_name": str(author_vk_id),
        "raw": {"from_id": from_id},
    }
