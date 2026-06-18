from abc import ABC, abstractmethod


class IngestionRepository(ABC):
    @abstractmethod
    async def upsert_group(self, group: dict, revive_if_deleted: bool = False) -> None:
        """Create or update group statistics in database."""

    @abstractmethod
    async def get_active_group_ids(self) -> list[int]:
        """Fetch list of all active VK groups monitored."""

    @abstractmethod
    async def upsert_author(self, author: dict) -> None:
        """Upsert collected VK author profile details."""

    @abstractmethod
    async def upsert_post(self, post: dict, task_id: int, group_id: int | None = None) -> None:
        """Upsert VK post record with source task association."""

    @abstractmethod
    async def upsert_comment(self, comment: dict, task_id: int) -> None:
        """Upsert VK comment record with source task association."""
