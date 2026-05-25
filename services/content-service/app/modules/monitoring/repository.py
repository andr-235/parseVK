import json
import logging
from datetime import datetime
from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import MonitoringGroup
from app.db.session import monitor_engine

logger = logging.getLogger(__name__)


class MonitoringRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

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
        # Для простоты посчитаем размер возвращенного списка
        groups = await self.get_groups(messenger=messenger, search=search, category=category)
        return len(groups)

    async def get_group_by_id(self, id: int) -> MonitoringGroup | None:
        query = select(MonitoringGroup).where(MonitoringGroup.id == id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_group_by_messenger_chat(self, messenger: str, chat_id: str) -> MonitoringGroup | None:
        query = select(MonitoringGroup).where(
            MonitoringGroup.messenger == messenger,
            MonitoringGroup.chat_id == chat_id
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def upsert_group(self, messenger: str, chat_id: str, name: str, category: str | None = None) -> MonitoringGroup:
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
                category=category
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
        if not monitor_engine:
            logger.warning("External monitor database is not configured.")
            return []

        if not keywords:
            return []

        # Разрешаем целевые таблицы
        table_names = self._resolve_source_tables(sources)
        if not table_names:
            return []

        # Строим параметры запроса
        params = {}
        conditions = []
        
        # Фильтрация по ключевым словам
        for idx, keyword in enumerate(keywords):
            param_key = f"keyword_{idx}"
            params[param_key] = f"%{keyword}%"
            conditions.append(f'"{settings.monitor_message_text_column}" ILIKE :{param_key}')

        where_clause = f'"{settings.monitor_message_text_column}" IS NOT NULL AND ({ " OR ".join(conditions) })'

        if from_date:
            params["from_date"] = from_date
            where_clause += f' AND "{settings.monitor_message_created_at_column}" >= :from_date'

        select_cols = [
            f'"{settings.monitor_message_id_column}" as id',
            f'"{settings.monitor_message_text_column}" as text',
            f'"{settings.monitor_message_created_at_column}" as "createdAt"',
        ]
        if settings.monitor_message_author_column:
            select_cols.append(f'"{settings.monitor_message_author_column}" as author')
        else:
            select_cols.append("NULL as author")

        if settings.monitor_message_chat_column:
            select_cols.append(f'"{settings.monitor_message_chat_column}" as chat')
        else:
            select_cols.append("NULL as chat")

        if settings.monitor_message_metadata_column:
            select_cols.append(f'"{settings.monitor_message_metadata_column}" as metadata')
        else:
            select_cols.append("NULL as metadata")

        # Формируем подзапросы для UNION
        subqueries = []
        for idx, table in enumerate(table_names):
            source_name = table.split(".")[-1]
            subqueries.append(
                f"SELECT {', '.join(select_cols)}, '{source_name}' as source FROM \"{table}\" WHERE {where_clause}"
            )

        params["limit"] = limit
        params["offset"] = offset

        if len(subqueries) == 1:
            sql = f"{subqueries[0]} ORDER BY \"{settings.monitor_message_created_at_column}\" DESC LIMIT :limit OFFSET :offset"
        else:
            sql = f"SELECT * FROM ({' UNION ALL '.join(subqueries)}) AS combined ORDER BY \"createdAt\" DESC LIMIT :limit OFFSET :offset"

        rows = []
        async with monitor_engine.connect() as conn:
            result = await conn.execute(text(sql), params)
            for r in result:
                # Извлекаем метаданные
                meta = r.metadata
                if meta and isinstance(meta, str):
                    try:
                        meta = json.loads(meta)
                    except Exception:
                        meta = {}
                elif not meta:
                    meta = {}

                # Извлечение S3 URL и других полей из метаданных (как в NestJS)
                raw = meta.get("raw", {}) if isinstance(meta, dict) else {}
                raw_s3 = raw.get("s3Info", {}) if isinstance(raw, dict) else {}

                text_val = r.text or (raw.get("body") or raw.get("caption") or raw.get("text") if isinstance(raw, dict) else None) or meta.get("text") if isinstance(meta, dict) else None
                url_val = raw_s3.get("url") or raw_s3.get("link") or raw.get("file_url") or raw.get("fileUrl") or raw.get("url") if isinstance(raw, dict) else None or meta.get("url") if isinstance(meta, dict) else None
                type_val = raw.get("mimetype") or raw.get("type") if isinstance(raw, dict) else None or meta.get("type") if isinstance(meta, dict) else None
                chat_name = meta.get("chat_name") or meta.get("chatName") or raw.get("chat_name") or raw.get("chatName") or raw.get("chat") or raw.get("title") if isinstance(raw, dict) else None

                rows.append({
                    "id": str(r.id),
                    "text": text_val or r.text,
                    "createdAt": r.createdAt.isoformat() if isinstance(r.createdAt, datetime) else r.createdAt,
                    "author": r.author,
                    "chat": r.chat or chat_name,
                    "source": r.source,
                    "contentUrl": url_val,
                    "contentType": type_val
                })
        return rows

    async def find_external_groups(self, sources: list[str] | None = None) -> list[dict]:
        if not monitor_engine:
            logger.warning("External monitor database is not configured.")
            return []

        # Если задана отдельная таблица групп
        if settings.monitor_groups_table:
            sql = f'SELECT DISTINCT "{settings.monitor_group_chat_id_column}"::text as "chatId", "{settings.monitor_group_name_column}"::text as "name" FROM "{settings.monitor_groups_table}" WHERE "{settings.monitor_group_chat_id_column}" IS NOT NULL AND "{settings.monitor_group_name_column}" IS NOT NULL'
            async with monitor_engine.connect() as conn:
                result = await conn.execute(text(sql))
                return [{"chatId": r.chatId, "name": r.name} for r in result]

        # Иначе вытаскиваем из метаданных сообщений
        table_names = self._resolve_source_tables(sources)
        if not table_names:
            return []

        subqueries = []
        for table in table_names:
            # Пытаемся вытащить chat_id и name из колонок или из JSONB метаданных
            chat_id_expr = f'"{settings.monitor_group_chat_id_column}"::text' if settings.monitor_message_chat_column else 'NULL::text'
            name_expr = f'"{settings.monitor_message_chat_column}"::text' if settings.monitor_message_chat_column else 'NULL::text'
            
            if settings.monitor_message_metadata_column:
                meta = f'"{settings.monitor_message_metadata_column}"::jsonb'
                chat_id_expr = f"COALESCE({chat_id_expr}, {meta}->>'chat_id', {meta}->>'chatId', {meta}->'raw'->>'chat_id', {meta}->'raw'->>'chatId')"
                name_expr = f"COALESCE({name_expr}, {meta}->>'chat_name', {meta}->>'chatName', {meta}->>'title', {meta}->'raw'->>'chat_name', {meta}->'raw'->>'chatName', {meta}->'raw'->>'title')"

            subqueries.append(
                f'SELECT DISTINCT {chat_id_expr} as "chatId", {name_expr} as "name" FROM "{table}"'
            )

        sql = f'SELECT DISTINCT "chatId", "name" FROM ({ " UNION ALL ".join(subqueries) }) AS combined WHERE "chatId" IS NOT NULL AND "name" IS NOT NULL'
        
        async with monitor_engine.connect() as conn:
            result = await conn.execute(text(sql))
            return [{"chatId": r.chatId, "name": r.name} for r in result]

    async def find_external_keywords(self) -> list[str] | None:
        if not monitor_engine or not settings.monitor_keywords_table:
            return None

        sql = f'SELECT "{settings.monitor_keyword_word_column}"::text as word FROM "{settings.monitor_keywords_table}" WHERE "{settings.monitor_keyword_word_column}" IS NOT NULL'
        async with monitor_engine.connect() as conn:
            result = await conn.execute(text(sql))
            return list(set(r.word.strip() for r in result if r.word.strip()))

    def _resolve_source_tables(self, sources: list[str] | None) -> list[str]:
        default_tables = [t.strip() for t in settings.monitor_messages_table.split(",") if t.strip()]
        if not sources:
            return default_tables

        resolved = []
        sources_lower = [s.lower() for s in sources]
        for table in default_tables:
            table_lower = table.lower()
            source_name = table.split(".")[-1].lower()
            if table_lower in sources_lower or source_name in sources_lower:
                resolved.append(table)
        return resolved or default_tables
