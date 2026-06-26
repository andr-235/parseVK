import logging

from sqlalchemy import func, or_, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ImKeyword, ImMessage, ImUserNotifierState

logger = logging.getLogger(__name__)


class NotifierRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_or_create_state(self, user_id: str, messenger: str) -> ImUserNotifierState:
        stmt = select(ImUserNotifierState).where(
            ImUserNotifierState.user_id == user_id,
            ImUserNotifierState.messenger == messenger,
        )
        existing = await self.session.scalar(stmt)
        if existing:
            return existing

        stmt = (
            insert(ImUserNotifierState)
            .values(user_id=user_id, messenger=messenger)
            .returning(ImUserNotifierState)
        )
        result = await self.session.execute(stmt)
        row = result.scalar_one()
        logger.info("Created notifier state: user_id=%s messenger=%s", user_id, messenger)
        return row

    async def update_cursor(self, user_id: str, messenger: str, last_seen_message_id: int) -> None:
        stmt = (
            update(ImUserNotifierState)
            .where(
                ImUserNotifierState.user_id == user_id,
                ImUserNotifierState.messenger == messenger,
            )
            .values(last_seen_message_id=last_seen_message_id)
        )
        await self.session.execute(stmt)
        logger.info(
            "Updated notifier cursor: user_id=%s messenger=%s last_seen=%d",
            user_id, messenger, last_seen_message_id,
        )

    async def find_new_messages(
        self,
        user_id: str,
        messenger: str,
        since_id: int,
        keywords: list[str],
        limit: int = 100,
    ) -> list[ImMessage]:
        if not keywords:
            return []

        patterns = [f"%{kw}%" for kw in keywords]
        conditions = [
            ImMessage.messenger == messenger,
            ImMessage.id > since_id,
            or_(ImMessage.text.ilike(p) for p in patterns),
        ]

        stmt = (
            select(ImMessage)
            .where(*conditions)
            .order_by(ImMessage.id.asc())
            .limit(limit)
        )
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def list_users_with_keywords(self, messenger: str | None = None) -> list[str]:
        stmt = select(ImKeyword.user_id).distinct()
        if messenger:
            stmt = stmt.where(ImKeyword.messenger == messenger)
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def get_max_message_id(self, messenger: str) -> int:
        stmt = select(func.max(ImMessage.id)).where(ImMessage.messenger == messenger)
        result = await self.session.scalar(stmt)
        return result or 0
