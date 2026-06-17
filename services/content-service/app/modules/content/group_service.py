from typing import Protocol


class GroupRepositoryProto(Protocol):
    async def list_groups(self, page: int, limit: int, search: str | None = None, sort_by: str | None = None, sort_order: str = "desc") -> dict: ...
    async def get_group(self, vk_group_id: int) -> dict | None: ...
    async def search_groups(self, query: str, limit: int) -> dict: ...
    async def list_groups_bulk(self, vk_group_ids: list[int]) -> list[dict]: ...
    async def upsert_group(self, group: dict) -> None: ...
    async def delete_group_and_related(self, vk_group_id: int) -> None: ...


class GroupContentService:
    def __init__(self, repo: GroupRepositoryProto):
        self._repo = repo

    @staticmethod
    def _normalize_text(value: str | None) -> str | None:
        return value.strip() or None if value else None

    @staticmethod
    def _normalize_sort_order(value: str | None) -> str:
        return value if value in {"asc", "desc"} else "desc"

    async def list_groups(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        sort_by: str | None = None,
        sort_order: str = "desc",
    ) -> dict:
        return await self._repo.list_groups(
            page=page,
            limit=limit,
            search=self._normalize_text(search),
            sort_by=sort_by,
            sort_order=self._normalize_sort_order(sort_order),
        )

    async def search_groups(self, q: str, limit: int) -> dict:
        return await self._repo.search_groups(self._normalize_text(q) or q, limit)

    async def get_group(self, vk_group_id: int) -> dict | None:
        return await self._repo.get_group(vk_group_id)

    async def list_groups_bulk(self, vk_group_ids: list[int]) -> list[dict]:
        return await self._repo.list_groups_bulk(vk_group_ids)

    async def save_group(self, group: dict) -> dict:
        await self._repo.upsert_group(group)
        row = await self._repo.get_group(int(group["id"]))
        return row or group

    async def delete_group(self, vk_group_id: int) -> bool:
        row = await self._repo.get_group(vk_group_id)
        if row is None:
            return False
        await self._repo.delete_group_and_related(vk_group_id)
        return True
