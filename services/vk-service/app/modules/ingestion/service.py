from dataclasses import dataclass
from typing import Any

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


class IngestionService:
    def __init__(
        self,
        *,
        adapter: VkApiAdapter,
        repository,
        tasks_client: TasksClient,
        outbox_service=None,
    ):
        self.adapter = adapter
        self.repository = repository
        self.tasks_client = tasks_client
        self.outbox = outbox_service

    def _sanitize_error(self, error: str) -> str:
        token = None
        if hasattr(self.adapter, "token") and self.adapter.token:
            token = self.adapter.token
        else:
            token = settings.vk_token

        if token and token in error:
            return error.replace(token, "<redacted>")
        return error

    async def execute(self, task_run: Any, *, correlation_id: str | None = None) -> IngestionResult:
        from datetime import datetime, timezone
        def utcnow() -> datetime:
            return datetime.now(timezone.utc)

        import httpx
        import sqlalchemy.exc
        import asyncio

        try:
            group_ids = await self._group_ids(task_run)
            result = await self._collect(task_run, group_ids, correlation_id=correlation_id)
            
            task_run.status = "done"
            task_run.finished_at = utcnow()
            task_run.processed_items = result.processed_items
            task_run.total_items = result.processed_items
            task_run.updated_at = utcnow()

            await self.tasks_client.complete_execution(
                task_run.task_id,
                task_run.run_id,
                result.processed_items,
                result.processed_items,
                result.stats(),
                request_id=task_run.run_id,
                correlation_id=correlation_id,
            )
            if self.outbox:
                await self.outbox.emit_task_completed(
                    task_id=task_run.task_id,
                    run_id=task_run.run_id,
                    stats=result.stats(),
                    correlation_id=correlation_id,
                )
            return result
        except Exception as exc:
            import logging
            logger = logging.getLogger("vk-service.ingestion")
            logger.exception("Task execution failed for task_run.task_id=%s", task_run.task_id)
            sanitized_error = self._sanitize_error(str(exc))
            
            task_run.status = "failed"
            task_run.finished_at = utcnow()
            task_run.last_error = sanitized_error
            task_run.processed_items = getattr(task_run, "processed_items", 0)
            task_run.total_items = getattr(task_run, "total_items", 0)
            task_run.updated_at = utcnow()

            if self.outbox:
                await self.outbox.emit_task_failed(
                    task_id=task_run.task_id,
                    run_id=task_run.run_id,
                    error=sanitized_error,
                    correlation_id=correlation_id,
                )
            try:
                await self.tasks_client.fail_execution(
                    task_run.task_id,
                    task_run.run_id,
                    sanitized_error,
                    task_run.processed_items,
                    task_run.total_items,
                    {},
                    request_id=task_run.run_id,
                    correlation_id=correlation_id,
                )
            except httpx.HTTPStatusError as callback_exc:
                if callback_exc.response.status_code == 409:
                    detail = "Unknown conflict"
                    try:
                        detail = callback_exc.response.json().get("detail", detail)
                    except Exception:
                        pass
                    task_run.last_error = f"{sanitized_error} | Callback conflict: {detail}"
                    
                    import logging
                    logger = logging.getLogger("vk-service.ingestion")
                    logger.warning(
                        "Fail callback returned 409 for task_id=%s, run_id=%s. Detail: %s. Not retrying as tasks-service is in a different lifecycle state.",
                        task_run.task_id,
                        task_run.run_id,
                        detail,
                    )
                else:
                    # Все остальные HTTP ошибки (400-499, 500+) пробрасываем наверх для ретрая Kafka
                    raise callback_exc from exc
            except (httpx.RequestError, sqlalchemy.exc.DBAPIError, asyncio.CancelledError) as callback_exc:
                raise callback_exc from exc

            is_infra_error = isinstance(exc, (sqlalchemy.exc.DBAPIError, asyncio.CancelledError))
            if isinstance(exc, httpx.RequestError) and not isinstance(exc, httpx.HTTPStatusError):
                is_infra_error = True
            elif isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code >= 500:
                is_infra_error = True

            if is_infra_error:
                raise
            
            return IngestionResult()

    async def _group_ids(self, task_run: Any) -> list[int]:
        if task_run.scope == "selected":
            return [int(item) for item in task_run.group_ids]
        group_ids = await self.repository.get_active_group_ids()
        if not group_ids:
            raise RuntimeError("No active groups configured for scope=all")
        return group_ids

    async def _collect(
        self, task_run: Any, group_ids: list[int], *, correlation_id: str | None = None
    ) -> IngestionResult:
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
                posts_response = await self.adapter.get_posts(group_id, mode=task_run.mode, post_limit=task_run.post_limit)
            except Exception as exc:
                sanitized = self._sanitize_error(str(exc))
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
                    import logging
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
                    await self.outbox.emit_post_collected(post, task_id=task_run.task_id, correlation_id=correlation_id)
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

    async def _enrich_user_profiles(
        self, profiles: dict[int, dict]
    ) -> None:
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
