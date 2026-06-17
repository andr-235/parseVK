from dataclasses import dataclass
from typing import Any, Callable

from app.clients.tasks.client import TasksClient
from app.modules.vk_api.client import VkApiAdapter


@dataclass
class IngestionResult:
    groups: int = 0
    posts: int = 0
    comments: int = 0
    authors: int = 0
    errors: list[dict] | None = None

    def stats(self) -> dict[str, int]:
        return {
            "groups": self.groups,
            "posts": self.posts,
            "comments": self.comments,
            "authors": self.authors,
            "errors": len(self.errors),
        }

    @property
    def processed_items(self) -> int:
        return self.groups + self.posts + self.comments


class DataCollector:
    def __init__(
        self,
        *,
        adapter: VkApiAdapter,
        repository,
        tasks_client: TasksClient,
        outbox=None,
        on_error: Callable[[str], str] | None = None,
    ):
        self.adapter = adapter
        self.repository = repository
        self.tasks_client = tasks_client
        self.outbox = outbox
        self._on_error = on_error or (lambda msg: msg)

    async def get_group_ids(self, task_run: Any) -> list[int]:
        if task_run.scope == "selected":
            return [int(item) for item in task_run.group_ids]
        group_ids = await self.repository.get_active_group_ids()
        if not group_ids:
            raise RuntimeError("No active groups configured for scope=all")
        return group_ids

    async def collect(
        self, task_run: Any, group_ids: list[int], *, correlation_id: str | None = None
    ) -> IngestionResult:
        import logging

        result = IngestionResult()
        result.errors = []
        groups = await self.adapter.get_groups(group_ids)
        for group in groups:
            group_id = int(group["id"])
            await self.repository.upsert_group(group)
            if self.outbox:
                await self.outbox.emit_group_collected(group, correlation_id=correlation_id)
            result.groups += 1

            try:
                posts_response = await self.adapter.get_posts(
                    group_id, mode=task_run.mode, post_limit=task_run.post_limit
                )
            except Exception as exc:
                sanitized = self._on_error(str(exc))
                result.errors.append({"group_id": group_id, "error": sanitized})
                continue

            posts = posts_response["items"]
            author_profiles: dict[int, dict] = {}
            for p in posts_response.get("profiles", []):
                author_profiles[p["id"]] = p
            for g in posts_response.get("groups", []):
                author_profiles[g["id"]] = g

            post_comments: list[list[dict]] = []
            valid_posts: list[dict] = []
            for post in posts:
                owner_id = post.get("owner_id")
                post_id = post.get("id")
                if owner_id is None or post_id is None:
                    logger = logging.getLogger("vk-service.ingestion")
                    logger.warning("Skipping post without owner_id or id: %s", post.get("id"))
                    continue
                post_comments.append([])
                valid_posts.append(post)
                comments_response = await self.adapter.get_comments(int(owner_id), int(post_id))
                comments = comments_response["items"]
                post_comments[-1] = comments
                for p in comments_response.get("profiles", []):
                    author_profiles.setdefault(p["id"], p)
                for g in comments_response.get("groups", []):
                    author_profiles.setdefault(g["id"], g)
            posts = valid_posts

            await self._enrich_user_profiles(author_profiles)

            for idx, post in enumerate(posts):
                if await self._upsert_post_author(post, author_profiles):
                    result.authors += 1
                await self.repository.upsert_post(post, task_id=task_run.task_id, group_id=group_id)
                if self.outbox:
                    await self.outbox.emit_post_collected(
                        post, task_id=task_run.task_id, correlation_id=correlation_id
                    )
                result.posts += 1

                for comment in post_comments[idx]:
                    if await self._upsert_comment_author(comment, author_profiles):
                        result.authors += 1
                    await self.repository.upsert_comment(comment, task_id=task_run.task_id)
                    if self.outbox:
                        await self.outbox.emit_comment_collected(
                            comment, task_id=task_run.task_id, correlation_id=correlation_id
                        )
                    result.comments += 1

                await self.tasks_client.update_progress(
                    task_run.task_id,
                    task_run.run_id,
                    result.processed_items,
                    result.processed_items,
                    1,
                    result.stats(),
                    request_id=task_run.run_id,
                    correlation_id=correlation_id,
                )
                if self.outbox:
                    await self.outbox.emit_task_progress_updated(
                        task_id=task_run.task_id,
                        run_id=task_run.run_id,
                        processed_items=result.processed_items,
                        total_items=result.processed_items,
                        progress=1,
                        stats=result.stats(),
                        correlation_id=correlation_id,
                    )
        return result

    async def _enrich_user_profiles(self, profiles: dict[int, dict]) -> None:
        user_ids = [uid for uid in profiles if uid > 0 and not profiles[uid].get("photo_50")]
        if not user_ids:
            return
        try:
            enriched = await self.adapter.get_users(
                user_ids,
                fields=["photo_50", "photo_100", "photo_200", "domain", "screen_name"],
            )
        except Exception:
            return
        for user in enriched:
            uid = user.get("id")
            if uid and uid in profiles:
                profiles[uid].update(user)

    async def _upsert_post_author(self, post: dict, profiles: dict[int, dict]) -> bool:
        from_id = post.get("from_id")
        if from_id is None:
            return False
        payload = self._author_payload(from_id, profiles)
        await self.repository.upsert_author(payload)
        if self.outbox:
            await self.outbox.emit_author_collected(payload)
        return True

    async def _upsert_comment_author(self, comment: dict, profiles: dict[int, dict]) -> bool:
        from_id = comment.get("from_id")
        if from_id is None:
            return False
        payload = self._author_payload(from_id, profiles)
        await self.repository.upsert_author(payload)
        if self.outbox:
            await self.outbox.emit_author_collected(payload)
        return True

    def _author_payload(self, from_id: int, profiles: dict[int, dict] | None = None) -> dict:
        vk_id = int(from_id)
        profile = profiles.get(vk_id) if profiles else None
        if profile is None and vk_id < 0:
            profile = profiles.get(abs(vk_id)) if profiles else None
        if profile:
            name = profile.get("name") or f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() or str(vk_id)
            return {
                "vk_author_id": vk_id,
                "type": "group" if vk_id < 0 else "user",
                "display_name": name,
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
            "vk_author_id": vk_id,
            "type": "group" if vk_id < 0 else "user",
            "display_name": str(vk_id),
            "raw": {"from_id": from_id},
        }
