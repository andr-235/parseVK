from app.domain.content.repositories import GroupRepository


class GroupService:
    def __init__(self, repository: GroupRepository):
        self.repository = repository

    async def list_groups(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        sort_by: str | None = None,
        sort_order: str = "desc",
    ) -> dict:
        return await self.repository.list_groups(
            page=page,
            limit=limit,
            search=search.strip() or None if search else None,
            sort_by=sort_by,
            sort_order=sort_order if sort_order in {"asc", "desc"} else "desc",
        )

    async def search_groups(self, query: str, limit: int) -> dict:
        return await self.repository.search_groups(query.strip(), limit)

    async def get_group(self, vk_group_id: int) -> dict | None:
        return await self.repository.get_group(vk_group_id)

    async def list_groups_bulk(self, ids: list[int]) -> list[dict]:
        return await self.repository.list_groups_bulk(ids)

    async def save_group(self, group: dict) -> dict:
        await self.repository.upsert_group(group)
        return await self.repository.get_group(int(group["id"])) or group

    async def delete_group(self, vk_group_id: int) -> bool:
        if await self.repository.get_group(vk_group_id) is None:
            return False
        await self.repository.delete_group_and_related(vk_group_id)
        return True
