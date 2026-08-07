import logging
from typing import Any

from app.domain.ports.vk_api import VkApiPort as VkApiAdapter
from app.services.ingestion.author_payload import post_author_payload
from app.services.ingestion.post_snapshot_reuse import stage_or_reuse_post_snapshot
from app.services.ingestion.prepared_stager import PreparedPhysicalIngestionStager

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
        staging: PreparedPhysicalIngestionStager | None = None,
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
            author_profiles.setdefault(int(profile["id"]), profile)
        for group_profile in posts_response.get("groups", []):
            author_profiles.setdefault(-abs(int(group_profile["id"])), group_profile)

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
    ) -> tuple[bool, dict]:
        author = post_author_payload(post, author_profiles)
        effective_post = post
        effective_authors = [author] if author is not None else []

        if self.staging is None:
            if self.require_staging:
                raise RuntimeError("durable post staging requires a fenced execution")
        else:
            resolved = await stage_or_reuse_post_snapshot(
                self.staging,
                post=post,
                authors=effective_authors,
            )
            effective_post = resolved.post
            effective_authors = list(resolved.authors)

        for stored_author in effective_authors:
            await self.repository.upsert_author(stored_author)
        await self.repository.upsert_post(
            effective_post,
            task_id=task_run.task_id,
            group_id=effective_post.get("owner_id"),
        )
        return bool(effective_authors), effective_post


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
