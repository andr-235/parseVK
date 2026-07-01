from abc import ABC, abstractmethod


class CommentRepository(ABC):
    @abstractmethod
    async def upsert_comment(self, comment: dict, task_id: int) -> None:
        ...
