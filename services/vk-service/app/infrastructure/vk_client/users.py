import logging
from collections.abc import Callable
from typing import Any

logger = logging.getLogger(__name__)


class UsersClient:
    def __init__(self, call_method: Callable[..., Any]):
        self._call = call_method

    async def get_user_photos(self, user_id: int, count: int = 100, offset: int = 0) -> list[dict]:
        logger.debug("photos.getAll for user_id=%d", user_id)
        response = await self._call(
            "photos.getAll",
            owner_id=user_id,
            count=min(max(count, 1), 200),
            offset=offset,
            extended=0,
            photo_sizes=1,
        )
        return list(response.get("items") or [])

    async def get_users(self, user_ids: list[int], fields: list[str]) -> list[dict]:
        if not user_ids:
            return []
        logger.debug("users.get for %d user_ids", len(user_ids))
        response = await self._call(
            "users.get",
            user_ids=",".join(str(uid) for uid in user_ids),
            fields=",".join(fields),
        )
        if isinstance(response, dict) and "response" in response:
            return list(response["response"])
        return list(response)

    async def test_token(self) -> dict:
        logger.debug("test_token via users.get")
        return await self._call("users.get", user_ids="1")
