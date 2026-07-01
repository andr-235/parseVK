from __future__ import annotations

import logging
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)
from app.modules.whappi.api_client import BaseApiClient
from app.modules.whappi.models import (
    MAX_CHATS_ENDPOINT,
    MAX_MESSAGES_ENDPOINT,
    WAPPI_CHATS_ENDPOINT,
    WAPPI_MESSAGES_ENDPOINT,
    WappiChat,
    WappiMessage,
)


class WappiClient:
    def __init__(self):
        self._http = BaseApiClient(
            base_url=settings.wappi_api_url,
            api_token=settings.wappi_api_token,
            profile_id=settings.wappi_profile_id,
            page_size=settings.wappi_page_size,
            request_timeout=settings.wappi_request_timeout,
        )

    async def close(self) -> None:
        await self._http.close()

    async def list_chats(self) -> list[WappiChat]:
        logger.debug("WappiClient.list_chats")
        raw = await self._http.paginate(
            WAPPI_CHATS_ENDPOINT,
            params=lambda: {"profile_id": self._http._profile_id, "show_all": "false"},
            method="POST",
        )
        return [WappiChat(item) for item in raw]

    async def list_messages(self, chat_id: str, time_from: int | None = None) -> list[dict]:
        logger.debug("WappiClient.list_messages chat_id=%s", chat_id)
        return await self._http.paginate(
            WAPPI_MESSAGES_ENDPOINT,
            params=lambda cid=chat_id, tf=time_from: {
                "profile_id": self._http._profile_id,
                "chat_id": self._http.normalize_chat_id(cid),
                "order": "asc",
                **({"date": self._http.format_message_date(tf)} if tf is not None else {}),
            },
        )

    async def get_messages(
        self, messenger: str, chat_id: str, *, from_date: datetime | None = None, limit: int = 100
    ) -> list[WappiMessage]:
        ts = int(from_date.timestamp()) if from_date else None
        raw_messages = await self.list_messages(chat_id, time_from=ts)
        if not settings.wappi_include_system:
            raw_messages = [m for m in raw_messages if m.get("type") != "system"]
        return [WappiMessage(m, chat_id, None) for m in raw_messages]


class MaxApiClient:
    def __init__(self):
        self._http = BaseApiClient(
            base_url=settings.wappi_api_url,
            api_token=settings.wappi_api_token,
            profile_id=settings.max_profile_id,
            page_size=settings.wappi_page_size,
            request_timeout=settings.wappi_request_timeout,
        )

    async def close(self) -> None:
        await self._http.close()

    async def list_chats(self) -> list[WappiChat]:
        logger.debug("MaxApiClient.list_chats")
        raw = await self._http.paginate(
            MAX_CHATS_ENDPOINT,
            params=lambda: {"profile_id": self._http._profile_id, "show_all": "false"},
            method="POST",
        )
        return [WappiChat(item) for item in raw]

    async def list_messages(self, chat_id: str, time_from: int | None = None) -> list[dict]:
        logger.debug("MaxApiClient.list_messages chat_id=%s", chat_id)
        return await self._http.paginate(
            MAX_MESSAGES_ENDPOINT,
            params=lambda cid=chat_id, tf=time_from: {
                "profile_id": self._http._profile_id,
                "chat_id": cid,
                "order": "asc",
                **({"date": self._http.format_message_date(tf)} if tf is not None else {}),
            },
        )

    async def get_messages(
        self, messenger: str, chat_id: str, *, from_date: datetime | None = None, limit: int = 100
    ) -> list[WappiMessage]:
        ts = int(from_date.timestamp()) if from_date else None
        raw_messages = await self.list_messages(chat_id, time_from=ts)
        if not settings.wappi_include_system:
            raw_messages = [m for m in raw_messages if m.get("type") != "system"]
        return [WappiMessage(m, chat_id, None) for m in raw_messages]
