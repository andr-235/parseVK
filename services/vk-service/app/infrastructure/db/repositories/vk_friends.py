import uuid
from collections.abc import Sequence
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redaction import redact_secrets
from app.domain.entities.vk_friends import VkFriendsExportJob as VkFriendsExportJobEntity
from app.domain.entities.vk_friends import VkFriendsJobLog as VkFriendsJobLogEntity
from app.infrastructure.db.models.vk_friends import VkFriendsExportJob, VkFriendsJobLog, VkFriendsRecord
from app.domain.repositories.vk_friends import VkFriendsRepository


def _to_export_job_entity(model: VkFriendsExportJob) -> VkFriendsExportJobEntity:
    return VkFriendsExportJobEntity(
        id=model.id,
        status=model.status,
        params=model.params,
        vk_user_id=model.vk_user_id,
        total_count=model.total_count,
        fetched_count=model.fetched_count,
        warning=model.warning,
        error=model.error,
        xlsx_path=model.xlsx_path,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def _to_job_log_entity(model: VkFriendsJobLog) -> VkFriendsJobLogEntity:
    return VkFriendsJobLogEntity(
        id=model.id,
        job_id=model.job_id,
        level=model.level,
        message=model.message,
        meta=model.meta,
        created_at=model.created_at,
    )


class SqlAlchemyVkFriendsRepository(VkFriendsRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_job(self, params: dict, vk_user_id: int | None = None) -> VkFriendsExportJobEntity:
        job = VkFriendsExportJob(
            params=params,
            vk_user_id=vk_user_id,
            status="RUNNING",
            fetched_count=0,
        )
        self.session.add(job)
        await self.session.flush()

        log_entry = VkFriendsJobLog(
            job_id=job.id,
            level="info",
            message="Export started",
        )
        self.session.add(log_entry)
        await self.session.flush()
        return _to_export_job_entity(job)

    async def get_job_by_id(self, job_id: uuid.UUID) -> VkFriendsExportJobEntity | None:
        stmt = select(VkFriendsExportJob).where(VkFriendsExportJob.id == job_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return _to_export_job_entity(model) if model is not None else None

    async def get_job_logs(self, job_id: uuid.UUID, limit: int = 200) -> Sequence[VkFriendsJobLogEntity]:
        stmt = (
            select(VkFriendsJobLog)
            .where(VkFriendsJobLog.job_id == job_id)
            .order_by(VkFriendsJobLog.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return [_to_job_log_entity(log) for log in result.scalars().all()]

    async def update_progress(self, job_id: uuid.UUID, fetched_count: int, total_count: int | None = None, warning: str | None = None) -> None:
        if warning is not None:
            warning = redact_secrets(warning)
        stmt = select(VkFriendsExportJob).where(VkFriendsExportJob.id == job_id)
        result = await self.session.execute(stmt)
        job = result.scalar_one_or_none()
        if job:
            job.fetched_count = fetched_count
            if total_count is not None:
                job.total_count = total_count
            if warning is not None:
                job.warning = warning
            await self.session.flush()

    async def complete_job(self, job_id: uuid.UUID, fetched_count: int, total_count: int | None, warning: str | None, xlsx_path: str) -> None:
        if warning is not None:
            warning = redact_secrets(warning)
        stmt = select(VkFriendsExportJob).where(VkFriendsExportJob.id == job_id)
        result = await self.session.execute(stmt)
        job = result.scalar_one_or_none()
        if job:
            job.status = "DONE"
            job.fetched_count = fetched_count
            if total_count is not None:
                job.total_count = total_count
            if warning is not None:
                job.warning = warning
            job.xlsx_path = xlsx_path
            await self.session.flush()

    async def fail_job(self, job_id: uuid.UUID, error: str, fetched_count: int, total_count: int | None = None, warning: str | None = None) -> None:
        error = redact_secrets(error)
        if warning is not None:
            warning = redact_secrets(warning)
        stmt = select(VkFriendsExportJob).where(VkFriendsExportJob.id == job_id)
        result = await self.session.execute(stmt)
        job = result.scalar_one_or_none()
        if job:
            job.status = "FAILED"
            job.error = error
            job.fetched_count = fetched_count
            if total_count is not None:
                job.total_count = total_count
            if warning is not None:
                job.warning = warning
            await self.session.flush()

    async def save_friends_batch(self, job_id: uuid.UUID, records: list[dict]) -> None:
        if not records:
            return
        for rec in records:
            record_obj = VkFriendsRecord(
                job_id=job_id,
                vk_friend_id=rec["vkFriendId"],
                payload=rec["payload"],
            )
            self.session.add(record_obj)
        await self.session.flush()

    async def append_log(self, job_id: uuid.UUID, level: str, message: str, meta: Any = None) -> None:
        message = redact_secrets(message)
        log_entry = VkFriendsJobLog(
            job_id=job_id,
            level=level,
            message=message,
            meta=meta,
        )
        self.session.add(log_entry)
        await self.session.flush()
