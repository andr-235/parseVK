import uuid
from collections.abc import Sequence
from typing import Any

from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redaction import redact_secrets
from app.domain.entities.ok_friends import OkFriendsExportJob as OkFriendsExportJobEntity
from app.domain.entities.ok_friends import OkFriendsJobLog as OkFriendsJobLogEntity
from app.infrastructure.db.models.ok_friends import OkFriendsExportJob, OkFriendsJobLog, OkFriendsRecord
from app.domain.repositories.ok_friends import OkFriendsRepository


def _to_export_job_entity(model: OkFriendsExportJob) -> OkFriendsExportJobEntity:
    return OkFriendsExportJobEntity(
        id=model.id,
        status=model.status,
        params=model.params,
        ok_user_id=model.ok_user_id,
        total_count=model.total_count,
        fetched_count=model.fetched_count,
        warning=model.warning,
        error=model.error,
        xlsx_path=model.xlsx_path,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def _to_job_log_entity(model: OkFriendsJobLog) -> OkFriendsJobLogEntity:
    return OkFriendsJobLogEntity(
        id=model.id,
        job_id=model.job_id,
        level=model.level,
        message=model.message,
        meta=model.meta,
        created_at=model.created_at,
    )


class SqlAlchemyOkFriendsRepository(OkFriendsRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_job(self, params: dict, ok_user_id: int | None = None) -> OkFriendsExportJobEntity:
        job = OkFriendsExportJob(
            params=params,
            ok_user_id=ok_user_id,
            status="RUNNING",
            fetched_count=0,
        )
        self.session.add(job)
        await self.session.flush()

        log_entry = OkFriendsJobLog(
            job_id=job.id,
            level="info",
            message="Export started",
        )
        self.session.add(log_entry)
        await self.session.flush()
        return _to_export_job_entity(job)

    async def get_job_by_id(self, job_id: uuid.UUID) -> OkFriendsExportJobEntity | None:
        stmt = select(OkFriendsExportJob).where(OkFriendsExportJob.id == job_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return _to_export_job_entity(model) if model is not None else None

    async def get_job_logs(self, job_id: uuid.UUID, limit: int = 200) -> Sequence[OkFriendsJobLogEntity]:
        stmt = (
            select(OkFriendsJobLog)
            .where(OkFriendsJobLog.job_id == job_id)
            .order_by(OkFriendsJobLog.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return [_to_job_log_entity(log) for log in result.scalars().all()]

    async def update_progress(self, job_id: uuid.UUID, fetched_count: int, total_count: int | None = None, warning: str | None = None) -> None:
        if warning is not None:
            warning = redact_secrets(warning)
        stmt = select(OkFriendsExportJob).where(OkFriendsExportJob.id == job_id)
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
        stmt = select(OkFriendsExportJob).where(OkFriendsExportJob.id == job_id)
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
        stmt = select(OkFriendsExportJob).where(OkFriendsExportJob.id == job_id)
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

    async def save_friends_batch(self, job_id: uuid.UUID, records: list[dict]) -> int:
        if not records:
            return 0
        values = [
            {"job_id": job_id, "ok_friend_id": rec["okFriendId"], "payload": rec["payload"]}
            for rec in records
        ]
        await self.session.execute(insert(OkFriendsRecord), values)
        await self.session.flush()
        return len(records)

    async def get_friend_record_payloads(self, job_id: uuid.UUID) -> list[dict]:
        stmt = select(OkFriendsRecord.payload).where(OkFriendsRecord.job_id == job_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def append_log(self, job_id: uuid.UUID, level: str, message: str, meta: Any = None) -> None:
        message = redact_secrets(message)
        log_entry = OkFriendsJobLog(
            job_id=job_id,
            level=level,
            message=message,
            meta=meta,
        )
        self.session.add(log_entry)
        await self.session.flush()
