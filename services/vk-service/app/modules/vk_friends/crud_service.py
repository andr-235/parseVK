import logging
import uuid
from typing import Any

from sqlalchemy import select

from app.core.redaction import redact_secrets
from app.db.models import VkFriendsExportJob, VkFriendsJobLog, VkFriendsRecord
from app.db.session import SessionLocal
from app.modules.vk_friends.schemas import JobStatus

logger = logging.getLogger(__name__)


class VkFriendsCrudService:
    def __init__(self, session_factory=None) -> None:
        self.session_factory = session_factory or SessionLocal

    async def create_job(self, params: dict, vk_user_id: int | None = None) -> VkFriendsExportJob:
        async with self.session_factory() as session:
            async with session.begin():
                job = VkFriendsExportJob(
                    params=params,
                    vk_user_id=vk_user_id,
                    status=JobStatus.RUNNING.value,
                    fetched_count=0,
                )
                session.add(job)
                await session.flush()

                log_entry = VkFriendsJobLog(
                    job_id=job.id,
                    level="info",
                    message="Export started",
                )
                session.add(log_entry)

                job_id = job.id
                status = job.status
                created_at = job.created_at

            return job

    async def append_log(self, job_id: uuid.UUID, level: str, message: str, meta: Any = None) -> None:
        message = redact_secrets(message)
        async with self.session_factory() as session:
            async with session.begin():
                log_entry = VkFriendsJobLog(
                    job_id=job_id,
                    level=level,
                    message=message,
                    meta=meta,
                )
                session.add(log_entry)

    async def update_progress(
        self,
        job_id: uuid.UUID,
        fetched_count: int,
        total_count: int | None = None,
        warning: str | None = None,
    ) -> None:
        if warning is not None:
            warning = redact_secrets(warning)
        async with self.session_factory() as session:
            async with session.begin():
                stmt = select(VkFriendsExportJob).where(VkFriendsExportJob.id == job_id)
                res = await session.execute(stmt)
                job = res.scalar_one_or_none()
                if job:
                    job.fetched_count = fetched_count
                    if total_count is not None:
                        job.total_count = total_count
                    if warning is not None:
                        job.warning = warning

    async def complete_job(
        self,
        job_id: uuid.UUID,
        fetched_count: int,
        total_count: int | None,
        warning: str | None,
        xlsx_path: str,
    ) -> None:
        if warning is not None:
            warning = redact_secrets(warning)
        async with self.session_factory() as session:
            async with session.begin():
                stmt = select(VkFriendsExportJob).where(VkFriendsExportJob.id == job_id)
                res = await session.execute(stmt)
                job = res.scalar_one_or_none()
                if job:
                    job.status = JobStatus.DONE.value
                    job.fetched_count = fetched_count
                    if total_count is not None:
                        job.total_count = total_count
                    if warning is not None:
                        job.warning = warning
                    job.xlsx_path = xlsx_path

    async def fail_job(
        self,
        job_id: uuid.UUID,
        error: str,
        fetched_count: int,
        total_count: int | None = None,
        warning: str | None = None,
    ) -> None:
        error = redact_secrets(error)
        if warning is not None:
            warning = redact_secrets(warning)
        async with self.session_factory() as session:
            async with session.begin():
                stmt = select(VkFriendsExportJob).where(VkFriendsExportJob.id == job_id)
                res = await session.execute(stmt)
                job = res.scalar_one_or_none()
                if job:
                    job.status = JobStatus.FAILED.value
                    job.error = error
                    job.fetched_count = fetched_count
                    if total_count is not None:
                        job.total_count = total_count
                    if warning is not None:
                        job.warning = warning

    async def save_friends_batch(self, job_id: uuid.UUID, records: list[dict]) -> None:
        if not records:
            return
        async with self.session_factory() as session:
            async with session.begin():
                for rec in records:
                    record_obj = VkFriendsRecord(
                        job_id=job_id,
                        vk_friend_id=rec["vkFriendId"],
                        payload=rec["payload"],
                    )
                    session.add(record_obj)

    async def get_job_by_id(self, job_id: uuid.UUID) -> VkFriendsExportJob | None:
        async with self.session_factory() as session:
            stmt = select(VkFriendsExportJob).where(VkFriendsExportJob.id == job_id)
            res = await session.execute(stmt)
            return res.scalar_one_or_none()

    async def get_job_logs(self, job_id: uuid.UUID, limit: int = 200) -> list[VkFriendsJobLog]:
        async with self.session_factory() as session:
            stmt = (
                select(VkFriendsJobLog)
                .where(VkFriendsJobLog.job_id == job_id)
                .order_by(VkFriendsJobLog.created_at.desc())
                .limit(limit)
            )
            res = await session.execute(stmt)
            return list(res.scalars().all())
