from abc import ABC, abstractmethod


class AuthorRepository(ABC):
    @abstractmethod
    async def upsert_author(self, author: dict) -> None:
        ...
