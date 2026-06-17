from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ImGroup, ImMessage


class IngestionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def upsert_message(self, messenger: str, message: dict[str, Any]) -> ImMessage:
        external_id = str(message["external_id"])
        chat_id = str(message["chat_id"])

        existing = await self.session.scalar(
            select(ImMessage).where(
                ImMessage.messenger == messenger,
                ImMessage.external_id == external_id,
                ImMessage.chat_external_id == chat_id,
            )
        )
        if existing:
            existing.text = message.get("text") or existing.text
            existing.chat_name = message.get("chat_name") or existing.chat_name
            existing.author = message.get("author") or existing.author
            existing.content_url = message.get("content_url") or existing.content_url
            existing.content_type = message.get("content_type") or existing.content_type
            existing.metadata_raw = message.get("metadata_raw") or existing.metadata_raw
            existing.raw = message.get("raw") or existing.raw
            if message.get("created_at"):
                existing.created_at = message["created_at"]
            return existing

        row = ImMessage(
            messenger=messenger,
            external_id=external_id,
            chat_external_id=chat_id,
            chat_name=message.get("chat_name"),
            author=message.get("author"),
            text=message.get("text"),
            content_url=message.get("content_url"),
            content_type=message.get("content_type"),
            metadata_raw=message.get("metadata_raw"),
            created_at=message.get("created_at"),
            raw=message.get("raw"),
        )
        self.session.add(row)
        await self.session.flush()
        return row

    async def upsert_group(
        self, messenger: str, chat_id: str, name: str | None,
        raw: dict | None = None,
    ) -> ImGroup:
        existing = await self.session.scalar(
            select(ImGroup).where(
                ImGroup.messenger == messenger,
                ImGroup.external_chat_id == chat_id,
            )
        )
        if existing:
            if name:
                existing.name = name
            if raw:
                existing.raw = raw
            return existing

        group = ImGroup(
            messenger=messenger,
            external_chat_id=chat_id,
            name=name,
            raw=raw,
        )
        self.session.add(group)
        await self.session.flush()
        return group

    async def get_active_group_ids(self, messenger: str) -> list[str]:
        result = await self.session.scalars(
            select(ImGroup.external_chat_id).where(ImGroup.messenger == messenger)
        )
        return list(result.all())
