import json
import logging
from datetime import datetime
from typing import Any

from app.db.models import MonitoringGroup
from sqlalchemy import (
    String,
    cast,
    column,
    func,
    literal,
    null,
    or_,
    select,
    table,
    union_all,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession
from sqlalchemy.sql.elements import quoted_name

logger = logging.getLogger(__name__)


class MonitoringRepository:
    def __init__(self, session: AsyncSession, *, cfg: Any, mon_engine: AsyncEngine | None):
        self.session = session
        self._cfg = cfg
        self._mon_engine = mon_engine

    async def get_groups(
        self,
        messenger: str | None = None,
        search: str | None = None,
        category: str | None = None,
    ) -> list[MonitoringGroup]:
        query = select(MonitoringGroup)
        if messenger:
            query = query.where(MonitoringGroup.messenger == messenger)
        if category:
            query = query.where(MonitoringGroup.category.ilike(category))
        if search:
            search_filter = f"%{search}%"
            query = query.where(
                MonitoringGroup.name.ilike(search_filter)
                | MonitoringGroup.chat_id.ilike(search_filter)
                | MonitoringGroup.category.ilike(search_filter)
            )
        query = query.order_by(MonitoringGroup.name.asc())
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_groups(
        self,
        messenger: str | None = None,
        search: str | None = None,
        category: str | None = None,
    ) -> int:
        # Для простоты считаем размер возвращенного списка.
        groups = await self.get_groups(messenger=messenger, search=search, category=category)
        return len(groups)

    async def get_group_by_id(self, id: int) -> MonitoringGroup | None:
        query = select(MonitoringGroup).where(MonitoringGroup.id == id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_group_by_messenger_chat(
        self,
        messenger: str,
        chat_id: str,
    ) -> MonitoringGroup | None:
        query = select(MonitoringGroup).where(
            MonitoringGroup.messenger == messenger,
            MonitoringGroup.chat_id == chat_id,
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def upsert_group(
        self,
        messenger: str,
        chat_id: str,
        name: str,
        category: str | None = None,
    ) -> MonitoringGroup:
        group = await self.get_group_by_messenger_chat(messenger, chat_id)
        if group:
            group.name = name
            if category is not None:
                group.category = category
        else:
            group = MonitoringGroup(
                messenger=messenger,
                chat_id=chat_id,
                name=name,
                category=category,
            )
            self.session.add(group)
        await self.session.flush()
        return group

    async def delete_group(self, id: int) -> bool:
        group = await self.get_group_by_id(id)
        if group:
            await self.session.delete(group)
            return True
        return False

    async def find_external_messages(
        self,
        keywords: list[str],
        limit: int,
        offset: int,
        from_date: datetime | None = None,
        sources: list[str] | None = None,
    ) -> list[dict]:
        if not self._mon_engine:
            logger.warning("External monitor database is not configured.")
            return []

        if not keywords:
            return []

        table_names = self._resolve_source_tables(sources)
        if not table_names:
            return []

        subqueries = []
        for table_name in table_names:
            msg_table = self._monitor_table(
                table_name,
                self._message_columns(include_group_columns=False),
            )
            text_col = self._monitor_column(msg_table, self._cfg.monitor_message_text_column)
            created_at_col = self._monitor_column(
                msg_table,
                self._cfg.monitor_message_created_at_column,
            )
            filters = [
                text_col.is_not(None),
                or_(*(text_col.ilike(f"%{keyword}%") for keyword in keywords)),
            ]
            if from_date:
                filters.append(created_at_col >= from_date)

            subqueries.append(
                select(
                    cast(
                        self._monitor_column(msg_table, self._cfg.monitor_message_id_column),
                        String,
                    ).label("id"),
                    text_col.label("text"),
                    created_at_col.label("createdAt"),
                    self._optional_monitor_column(
                        msg_table,
                        self._cfg.monitor_message_author_column,
                        "author",
                    ),
                    self._optional_monitor_column(
                        msg_table,
                        self._cfg.monitor_message_chat_column,
                        "chat",
                    ),
                    self._optional_monitor_column(
                        msg_table,
                        self._cfg.monitor_message_metadata_column,
                        "metadata",
                    ),
                    literal(table_name.split(".")[-1]).label("source"),
                ).where(*filters)
            )

        if len(subqueries) == 1:
            combined = subqueries[0].subquery("combined")
        else:
            combined = union_all(*subqueries).subquery("combined")
        query = select(combined).order_by(combined.c.createdAt.desc()).limit(limit).offset(offset)

        rows = []
        async with self._mon_engine.connect() as conn:
            result = await conn.execute(query)
            for r in result:
                meta = self._parse_metadata(r.metadata)
                raw = meta.get("raw", {}) if isinstance(meta, dict) else {}
                raw_s3 = raw.get("s3Info", {}) if isinstance(raw, dict) else {}

                text_val = (
                    r.text
                    or self._metadata_value(raw, "body", "caption", "text")
                    or self._metadata_value(meta, "text")
                )
                url_val = (
                    self._metadata_value(raw_s3, "url", "link")
                    or self._metadata_value(raw, "file_url", "fileUrl", "url")
                    or self._metadata_value(meta, "url")
                )
                type_val = (
                    self._metadata_value(raw, "mimetype", "type")
                    or self._metadata_value(meta, "type")
                )
                chat_name = (
                    self._metadata_value(meta, "chat_name", "chatName")
                    or self._metadata_value(raw, "chat_name", "chatName", "chat", "title")
                )

                rows.append({
                    "id": str(r.id),
                    "text": text_val or r.text,
                    "createdAt": (
                        r.createdAt.isoformat()
                        if isinstance(r.createdAt, datetime)
                        else r.createdAt
                    ),
                    "author": r.author,
                    "chat": r.chat or chat_name,
                    "source": r.source,
                    "contentUrl": url_val,
                    "contentType": type_val,
                })
        return rows

    async def find_external_groups(self, sources: list[str] | None = None) -> list[dict]:
        if not self._mon_engine:
            logger.warning("External monitor database is not configured.")
            return []

        if self._cfg.monitor_groups_table:
            groups_table = self._monitor_table(
                self._cfg.monitor_groups_table,
                [
                    self._cfg.monitor_group_chat_id_column,
                    self._cfg.monitor_group_name_column,
                ],
            )
            chat_id_col = self._monitor_column(groups_table, self._cfg.monitor_group_chat_id_column)
            name_col = self._monitor_column(groups_table, self._cfg.monitor_group_name_column)
            query = (
                select(
                    cast(chat_id_col, String).label("chatId"),
                    cast(name_col, String).label("name"),
                )
                .distinct()
                .where(chat_id_col.is_not(None), name_col.is_not(None))
            )
            async with self._mon_engine.connect() as conn:
                result = await conn.execute(query)
                return [{"chatId": r.chatId, "name": r.name} for r in result]

        table_names = self._resolve_source_tables(sources)
        if not table_names:
            return []

        subqueries = []
        for table_name in table_names:
            msg_table = self._monitor_table(
                table_name,
                self._message_columns(include_group_columns=True),
            )
            chat_id_expr = (
                cast(
                    self._monitor_column(msg_table, self._cfg.monitor_group_chat_id_column),
                    String,
                )
                if self._cfg.monitor_message_chat_column
                else null()
            )
            name_expr = (
                cast(self._monitor_column(msg_table, self._cfg.monitor_message_chat_column), String)
                if self._cfg.monitor_message_chat_column
                else null()
            )

            if self._cfg.monitor_message_metadata_column:
                metadata = cast(
                    self._monitor_column(msg_table, self._cfg.monitor_message_metadata_column),
                    JSONB,
                )
                chat_id_expr = func.coalesce(
                    chat_id_expr,
                    metadata["chat_id"].astext,
                    metadata["chatId"].astext,
                    metadata["raw"]["chat_id"].astext,
                    metadata["raw"]["chatId"].astext,
                )
                name_expr = func.coalesce(
                    name_expr,
                    metadata["chat_name"].astext,
                    metadata["chatName"].astext,
                    metadata["title"].astext,
                    metadata["raw"]["chat_name"].astext,
                    metadata["raw"]["chatName"].astext,
                    metadata["raw"]["title"].astext,
                )

            subqueries.append(
                select(chat_id_expr.label("chatId"), name_expr.label("name")).distinct()
            )

        combined = union_all(*subqueries).subquery("combined")
        query = (
            select(combined.c.chatId.label("chatId"), combined.c.name)
            .distinct()
            .where(combined.c.chatId.is_not(None), combined.c.name.is_not(None))
        )

        async with self._mon_engine.connect() as conn:
            result = await conn.execute(query)
            return [{"chatId": r.chatId, "name": r.name} for r in result]

    async def find_external_keywords(self) -> list[str] | None:
        if not self._mon_engine or not self._cfg.monitor_keywords_table:
            return None

        keywords_table = self._monitor_table(
            self._cfg.monitor_keywords_table,
            [self._cfg.monitor_keyword_word_column],
        )
        word_col = self._monitor_column(keywords_table, self._cfg.monitor_keyword_word_column)
        query = select(cast(word_col, String).label("word")).where(word_col.is_not(None))
        async with self._mon_engine.connect() as conn:
            result = await conn.execute(query)
            return list(set(r.word.strip() for r in result if r.word.strip()))

    def _resolve_source_tables(self, sources: list[str] | None) -> list[str]:
        default_tables = [
            table_name.strip()
            for table_name in self._cfg.monitor_messages_table.split(",")
            if table_name.strip()
        ]
        if not sources:
            return default_tables

        resolved = []
        sources_lower = [s.lower() for s in sources]
        for table_name in default_tables:
            table_lower = table_name.lower()
            source_name = table_name.split(".")[-1].lower()
            if table_lower in sources_lower or source_name in sources_lower:
                resolved.append(table_name)
        return resolved or default_tables

    def _message_columns(self, *, include_group_columns: bool) -> list[str]:
        names = [
            self._cfg.monitor_message_id_column,
            self._cfg.monitor_message_text_column,
            self._cfg.monitor_message_created_at_column,
            self._cfg.monitor_message_author_column,
            self._cfg.monitor_message_chat_column,
            self._cfg.monitor_message_metadata_column,
        ]
        if include_group_columns:
            names.append(self._cfg.monitor_group_chat_id_column)
        return [name for name in names if name]

    def _monitor_table(self, table_name: str, columns: list[str]):
        unique_columns = []
        for name in columns:
            if name not in unique_columns:
                unique_columns.append(name)
        return table(
            quoted_name(table_name, True),
            *(self._quoted_column(name) for name in unique_columns),
        )

    def _monitor_column(self, selectable, column_name: str):
        return selectable.c[column_name]

    def _optional_monitor_column(self, selectable, column_name: str | None, label: str):
        if not column_name:
            return null().label(label)
        return self._monitor_column(selectable, column_name).label(label)

    def _quoted_column(self, column_name: str):
        if column_name == self._cfg.monitor_message_metadata_column:
            return column(quoted_name(column_name, True), JSONB)
        return column(quoted_name(column_name, True))

    def _parse_metadata(self, value: Any) -> dict:
        if value and isinstance(value, str):
            try:
                parsed = json.loads(value)
            except Exception:
                return {}
            return parsed if isinstance(parsed, dict) else {}
        if value and isinstance(value, dict):
            return value
        return {}

    def _metadata_value(self, source: Any, *keys: str) -> Any:
        if not isinstance(source, dict):
            return None
        for key in keys:
            value = source.get(key)
            if value:
                return value
        return None
