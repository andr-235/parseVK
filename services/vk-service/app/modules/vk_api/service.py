import logging
from uuid import UUID

from sqlalchemy import delete, or_, select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import VkAuthor, VkComment, VkGroup, VkPost
from app.modules.ingestion.repository import IngestionRepository
from app.modules.outbox.repository import OutboxRepository
from app.modules.outbox.service import OutboxService
from app.db.models import utcnow

logger = logging.getLogger(__name__)


class VkApiService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.ingestion = IngestionRepository(session)
        self.outbox = OutboxService(OutboxRepository(session))

    async def save_group(self, group_data: dict, correlation_id: str | None = None) -> dict:
        await self.ingestion.upsert_group(group_data, revive_if_deleted=True)
        await self.outbox.emit_group_collected(group_data, correlation_id=correlation_id)
        return group_data

    async def delete_group(self, vk_group_id: int, correlation_id: str | None = None) -> bool:
        now = utcnow()
        owner_id = -vk_group_id

        group_exists = await self.session.scalar(
            select(VkGroup.vk_group_id).where(
                VkGroup.vk_group_id == vk_group_id,
                VkGroup.deleted_at.is_(None),
            )
        )
        if group_exists is None:
            return True

        await self.session.execute(
            update(VkGroup).where(VkGroup.vk_group_id == vk_group_id).values(deleted_at=now)
        )

        post_ids = (
            await self.session.scalars(
                select(VkPost.vk_post_id).where(
                    or_(
                        VkPost.vk_group_id == vk_group_id,
                        VkPost.vk_owner_id == owner_id,
                    )
                )
            )
        ).all()

        if post_ids:
            await self.session.execute(delete(VkComment).where(VkComment.vk_post_id.in_(post_ids)))
            await self.session.execute(
                delete(VkPost).where(VkPost.vk_post_id.in_(post_ids))
            )

        author_has_content = await self.session.scalar(
            select(func.count()).select_from(
                select(VkPost.vk_post_id).where(VkPost.author_vk_id == owner_id).union(
                    select(VkComment.vk_comment_id).where(VkComment.author_vk_id == owner_id)
                ).subquery()
            )
        )
        if (author_has_content or 0) == 0:
            await self.session.execute(delete(VkAuthor).where(VkAuthor.vk_author_id == owner_id))

        await self.outbox.emit_group_deleted(vk_group_id, correlation_id=correlation_id)
        return True

    async def delete_all_groups(self, correlation_id: str | None = None) -> list[int]:
        now = utcnow()
        group_ids = (await self.session.scalars(
            select(VkGroup.vk_group_id).where(VkGroup.deleted_at.is_(None))
        )).all()
        for vk_group_id in group_ids:
            await self.delete_group(vk_group_id, correlation_id=correlation_id)
        return list(group_ids)
