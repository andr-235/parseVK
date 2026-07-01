from abc import ABC, abstractmethod


class PostRepository(ABC):
    @abstractmethod
    async def upsert_post(self, post: dict, task_id: int, group_id: int | None = None) -> None:
        ...
