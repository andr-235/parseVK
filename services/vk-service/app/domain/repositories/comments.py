from abc import ABC, abstractmethod


class CommentRepository(ABC):
    @abstractmethod
    async def upsert_comment(self, comment: dict, task_id: int) -> None:
        ...

    @abstractmethod
    async def count_for_post(self, owner_id: int, post_id: int) -> int:
        """Count unique comments for a given VK post."""
        ...
