from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import TelegramJob, TelegramJobLog


class TelegramServiceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_job(self, params: dict, total_count: int) -> dict:
        job = TelegramJob(params=params, total_count=total_count)
        self.session.add(job)
        await self.session.flush()
        return {
            "id": str(job.id),
            "status": job.status,
            "fetchedCount": job.fetched_count,
            "totalCount": job.total_count,
            "createdAt": job.created_at.isoformat(),
        }

    async def get_job(self, job_id: UUID) -> dict | None:
        result = await self.session.execute(select(TelegramJob).where(TelegramJob.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            return None
        return {
            "id": str(job.id),
            "status": job.status,
            "fetchedCount": job.fetched_count,
            "totalCount": job.total_count,
            "progress": job.progress,
            "warning": job.warning,
            "error": job.error,
            "xlsxPath": job.xlsx_path,
            "createdAt": job.created_at.isoformat(),
        }

    async def update_job(self, job_id: UUID, data: dict) -> None:
        job_data = {}
        field_map = {
            "status": TelegramJob.status,
            "fetchedCount": TelegramJob.fetched_count,
            "totalCount": TelegramJob.total_count,
            "progress": TelegramJob.progress,
            "warning": TelegramJob.warning,
            "error": TelegramJob.error,
            "xlsxPath": TelegramJob.xlsx_path,
        }
        for key, column in field_map.items():
            if key in data:
                job_data[column] = data[key]
        if job_data:
            await self.session.execute(
                update(TelegramJob).where(TelegramJob.id == job_id).values(**job_data)
            )

    async def add_log(self, job_id: UUID, level: str, message: str) -> dict:
        log = TelegramJobLog(job_id=job_id, level=level, message=message)
        self.session.add(log)
        await self.session.flush()
        return {
            "id": str(log.id),
            "level": log.level,
            "message": log.message,
            "createdAt": log.created_at.isoformat(),
        }

    async def get_logs(self, job_id: UUID) -> list[dict]:
        result = await self.session.execute(
            select(TelegramJobLog)
            .where(TelegramJobLog.job_id == job_id)
            .order_by(TelegramJobLog.created_at)
        )
        logs = result.scalars().all()
        return [
            {
                "id": str(log.id),
                "level": log.level,
                "message": log.message,
                "createdAt": log.created_at.isoformat(),
            }
            for log in logs
        ]
