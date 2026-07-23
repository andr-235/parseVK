from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ImGroup, ImMessage
from app.modules.ingestion.mapper import NormalizedImMessage
from app.modules.ingestion.sanitization import (
    sanitize_postgres_text,
    sanitize_source_payload,
    validate_external_identifier,
)

logger = logging.getLogger(__name__)


class IngestionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def upsert_message(self, message: NormalizedImMessage) -> ImMessage:
        validate_external_identifier(message.messenger, "messenger")
        validate_external_identifier(message.external_id, "external_id")
        validate_external_identifier(message.chat_id, "chat_id")

        # Defence-in-depth: sanitize scalar text fields
        text = sanitize_postgres_text(message.text)
        chat_name = sanitize_postgres_text(message.chat_name)
        author = sanitize_postgres_text(message.author_name)
        content_url = sanitize_postgres_text(message.content_url)
        content_type = sanitize_postgres_text(message.content_type)

        if (
            text != message.text
            or chat_name != message.chat_name
            or author != message.author_name
            or content_url != message.content_url
            or content_type != message.content_type
        ):
            logger.warning(
                "upsert_message: sanitized NUL in text field for %s:%s",
                message.messenger,
                message.external_id,
            )

        existing = await self.session.scalar(
            select(ImMessage).where(
                ImMessage.messenger == message.messenger,
                ImMessage.external_id == message.external_id,
                ImMessage.chat_external_id == message.chat_id,
            )
        )
        if existing:
            existing.text = text or existing.text
            existing.chat_name = chat_name or existing.chat_name
            existing.author = author or existing.author
            existing.content_url = content_url or existing.content_url
            existing.content_type = content_type or existing.content_type
            existing.metadata_raw = message.raw
            existing.raw = message.raw
            if message.created_at:
                existing.created_at = message.created_at
            return existing

        row = ImMessage(
            messenger=message.messenger,
            external_id=message.external_id,
            chat_external_id=message.chat_id,
            chat_name=chat_name,
            author=author,
            text=text,
            content_url=content_url,
            content_type=content_type,
            metadata_raw=message.raw,
            created_at=message.created_at,
            raw=message.raw,
        )
        self.session.add(row)
        await self.session.flush()
        return row

    async def upsert_group(
        self, messenger: str, chat_id: str, name: str | None,
        raw: dict | None = None,
    ) -> ImGroup:
        validate_external_identifier(chat_id, "chat_id")

        # Defence-in-depth sanitization for group data
        sanitized_name = sanitize_postgres_text(name)
        sanitized_raw = sanitize_source_payload(raw).value if raw else None

        existing = await self.session.scalar(
            select(ImGroup).where(
                ImGroup.messenger == messenger,
                ImGroup.external_chat_id == chat_id,
            )
        )
        if existing:
            if sanitized_name:
                existing.name = sanitized_name
            if sanitized_raw:
                existing.raw = sanitized_raw
            return existing

        group = ImGroup(
            messenger=messenger,
            external_chat_id=chat_id,
            name=sanitized_name,
            raw=sanitized_raw,
        )
        self.session.add(group)
        await self.session.flush()
        return group

    async def get_active_group_ids(self, messenger: str) -> list[str]:
        result = await self.session.scalars(
            select(ImGroup.external_chat_id).where(ImGroup.messenger == messenger)
        )
        return list(result.all())
