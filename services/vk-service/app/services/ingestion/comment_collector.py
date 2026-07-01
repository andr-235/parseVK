import logging
from typing import Any

from app.domain.ports.vk_api import VkApiPort as VkApiAdapter
from app.services.ingestion.post_collector import _author_payload as _make_author_payload

logger = logging.getLogger("vk-service.ingestion")


class CommentCollector:
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

    async def collect_for_post(
        self,
        owner_id: int,
        post_id: int,
        author_profiles: dict[int, dict],
        *,
        correlation_id: str | None = None,
    ) -> list[dict]:
        comments_response = await self.adapter.get_comments(int(owner_id), int(post_id))
        comments = comments_response["items"]

        for profile in comments_response.get("profiles", []):
            author_profiles.setdefault(profile["id"], profile)
        for group_profile in comments_response.get("groups", []):
            author_profiles.setdefault(group_profile["id"], group_profile)

        return comments

    async def save_comment(
        self,
        comment: dict,
        task_run: Any,
        author_profiles: dict[int, dict],
        *,
        correlation_id: str | None = None,
    ) -> bool:
        author_added = await self._upsert_comment_author(comment, author_profiles)
        await self.repository.upsert_comment(comment, task_id=task_run.task_id)
        if self.outbox:
            await self.outbox.emit_comment_collected(
                comment, task_id=task_run.task_id, correlation_id=correlation_id
            )
        return author_added

    async def _upsert_comment_author(self, comment: dict, profiles: dict[int, dict]) -> bool:
        from_id = comment.get("from_id")
        if from_id is None:
            return False
        payload = _make_author_payload(from_id, profiles)
        await self.repository.upsert_author(payload)
        if self.outbox:
            await self.outbox.emit_author_collected(payload)
        return True
