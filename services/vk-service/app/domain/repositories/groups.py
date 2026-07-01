from abc import ABC, abstractmethod


class GroupRepository(ABC):
    @abstractmethod
    async def upsert_group(self, group: dict, revive_if_deleted: bool = False) -> None:
        ...

    @abstractmethod
    async def get_active_group_ids(self) -> list[int]:
        ...

    @abstractmethod
    async def soft_delete_group(self, vk_group_id: int) -> bool:
        ...
