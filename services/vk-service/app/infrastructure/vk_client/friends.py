import logging
from collections.abc import Callable
from typing import Any

logger = logging.getLogger(__name__)


class FriendsClient:
    def __init__(self, call_method: Callable[..., Any]):
        self._call = call_method

    async def friends_get(self, **params) -> dict:
        logger.debug("friends.get with params=%s", params)
        return await self._call("friends.get", **params)
