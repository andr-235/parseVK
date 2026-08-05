from typing import Any

from app.domain.ports.vk_api import VkApiPort as VkApiAdapter

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
        outbox=None,
    ) -> None:
        self.adapter = adapter
        self.repository = repository
        self.outbox = outbox

    async def get_group_ids(self, task_run: Any) -> list[int]:
        plan = task_run.plan_snapshot
        source = plan.get("source") if isinstance(plan, dict) else None
        external_id = source.get("externalId") if isinstance(source, dict) else None
        try:
            group_id = int(external_id)
        except (TypeError, ValueError) as exc:
            raise RuntimeError("Execution plan has no valid source externalId") from exc
        if group_id <= 0:
            raise RuntimeError("Execution plan source externalId must be positive")
        return [group_id]

    async def collect_group(self, group_id: int, *, correlation_id: str | None = None) -> None:
        group = await self.adapter.get_groups([group_id], fields=_GROUP_FIELDS)
        if not group:
            return
        await self.repository.upsert_group(group[0])
        if self.outbox:
            await self.outbox.emit_group_collected(group[0], correlation_id=correlation_id)
