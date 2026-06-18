import uuid
from typing import Any, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.repositories.vk_friends import VkFriendsRepository
from app.domain.models.vk_friends import VkFriendsExportJob, VkFriendsJobLog, VkFriendsRecord
from app.core.redaction import redact_secrets

class SqlAlchemyVkFriendsRepository(VkFriendsRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_job(self, params: dict, vk_user_id: int | None = None) -> VkFriendsExportJob:
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
        return job

    async def get_job_by_id(self, job_id: uuid.UUID) -> VkFriendsExportJob | None:
        stmt = select(VkFriendsExportJob).where(VkFriendsExportJob.id == job_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_job_logs(self, job_id: uuid.UUID, limit: int = 200) -> Sequence[VkFriendsJobLog]:
        stmt = (
            select(VkFriendsJobLog)
            .where(VkFriendsJobLog.job_id == job_id)
            .order_by(VkFriendsJobLog.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

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
