import logging
from typing import Any

from app.domain.ports.vk_api import VkApiPort as VkApiAdapter
from app.services.ingestion.staging_writer import PhysicalIngestionStager

logger = logging.getLogger("vk-service.ingestion")

_POST_STRATEGY_TO_MODE = {
    "latestByPublishedAt": "recent_posts",
}


class PostCollector:
    def __init__(
        self,
        *,
        adapter: VkApiAdapter,
        repository,
        staging: PhysicalIngestionStager | None = None,
        require_staging: bool = False,
    ) -> None:
        self.adapter = adapter
        self.repository = repository
        self.staging = staging
        self.require_staging = require_staging

    async def collect_for_group(
        self,
        group_id: int,
        task_run: Any,
        author_profiles: dict[int, dict],
        *,
        correlation_id: str | None = None,
    ) -> list[dict]:
        posts_response = await self.adapter.get_posts(
            group_id,
            mode=post_collection_mode(task_run),
            post_limit=task_run.post_limit,
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
                logger.warning("Skipping post without owner_id or id: %s", post_id)
                continue
            valid_posts.append(post)
        return valid_posts

    async def save_post(
        self,
        post: dict,
        task_run: Any,
        author_profiles: dict[int, dict],
        *,
        correlation_id: str | None = None,
    ) -> bool:
        author_payload = _post_author_payload(post, author_profiles)
        if self.staging is None:
            if self.require_staging:
                raise RuntimeError("durable post staging requires a fenced execution")
        else:
            await self.staging.stage_post(
                post=post,
                authors=[author_payload] if author_payload is not None else [],
            )

        if author_payload is not None:
            await self.repository.upsert_author(author_payload)
        await self.repository.upsert_post(
            post,
            task_id=task_run.task_id,
            group_id=post.get("owner_id"),
        )
        return author_payload is not None


def post_collection_mode(task_run: Any) -> str:
    plan = getattr(task_run, "plan_snapshot", None)
    post_selection = plan.get("postSelection") if isinstance(plan, dict) else None
    strategy = (
        post_selection.get("strategy")
        if isinstance(post_selection, dict)
        else None
    )
    mode = _POST_STRATEGY_TO_MODE.get(strategy)
    if mode is None:
        raise RuntimeError("Execution plan has unsupported postSelection strategy")
    return mode


def _post_author_payload(
    post: dict,
    profiles: dict[int, dict],
) -> dict | None:
    from_id = post.get("from_id")
    if from_id is None:
        return None
    return _author_payload(int(from_id), profiles)


def _author_payload(
    from_id: int,
    profiles: dict[int, dict] | None = None,
) -> dict:
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
