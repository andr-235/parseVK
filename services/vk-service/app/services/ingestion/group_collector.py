from typing import Any

from app.domain.ports.vk_api import VkApiPort as VkApiAdapter
from app.infrastructure.tasks_client.client import TasksClient

_GROUP_FIELDS = [
    "members_count",
    "city",
    "activity",
    "status",
    "verified",
    "description",
    "addresses",
    "counters",
    "photo_50",
    "photo_100",
    "photo_200",
]


class GroupCollector:
    def __init__(
        self,
        *,
        adapter: VkApiAdapter,
        repository,
        tasks_client: TasksClient,
        outbox=None,
    ) -> None:
        self.adapter = adapter
        self.repository = repository
        self.tasks_client = tasks_client
        self.outbox = outbox

    async def get_group_ids(self, task_run: Any) -> list[int]:
        if task_run.scope == "selected":
            return [int(item) for item in task_run.group_ids]
        group_ids = await self.repository.get_active_group_ids()
        if not group_ids:
            raise RuntimeError("No active groups configured for scope=all")
        return group_ids

    async def collect_group(self, group_id: int, *, correlation_id: str | None = None) -> None:
        group = await self.adapter.get_groups([group_id], fields=_GROUP_FIELDS)
        if not group:
            return
        await self.repository.upsert_group(group[0])
        if self.outbox:
            await self.outbox.emit_group_collected(group[0], correlation_id=correlation_id)
