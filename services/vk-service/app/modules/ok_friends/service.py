import uuid
from typing import Any

from app.db.models import OkFriendsExportJob, OkFriendsJobLog
from app.modules.ok_api.client import OkApiClient
from app.modules.ok_friends.crud_service import OkFriendsCrudService
from app.modules.ok_friends.export_service import OkFriendsExportJobRunner


class OkFriendsExportService:
    def __init__(self, session_factory=None) -> None:
        self.crud = OkFriendsCrudService(session_factory)
        svc = self
        self.runner = OkFriendsExportJobRunner(
            append_log=lambda *a, **kw: svc.crud.append_log(*a, **kw),
            update_progress=lambda *a, **kw: svc.crud.update_progress(*a, **kw),
            complete_job=lambda *a, **kw: svc.crud.complete_job(*a, **kw),
            fail_job=lambda *a, **kw: svc.crud.fail_job(*a, **kw),
            save_friends_batch=lambda *a, **kw: svc.crud.save_friends_batch(*a, **kw),
            get_ok_client=lambda: svc._get_ok_client(),
        )

    def _get_ok_client(self) -> Any:
        return OkApiClient()

    async def create_job(self, params: dict, ok_user_id: int | None = None) -> OkFriendsExportJob:
        return await self.crud.create_job(params, ok_user_id)

    async def append_log(self, job_id: uuid.UUID, level: str, message: str, meta: Any = None) -> None:
        await self.crud.append_log(job_id, level, message, meta)

    async def update_progress(
        self,
        job_id: uuid.UUID,
        fetched_count: int,
        total_count: int | None = None,
        warning: str | None = None,
    ) -> None:
        await self.crud.update_progress(job_id, fetched_count, total_count, warning)

    async def complete_job(
        self,
        job_id: uuid.UUID,
        fetched_count: int,
        total_count: int | None,
        warning: str | None,
        xlsx_path: str,
    ) -> None:
        await self.crud.complete_job(job_id, fetched_count, total_count, warning, xlsx_path)

    async def fail_job(
        self,
        job_id: uuid.UUID,
        error: str,
        fetched_count: int,
        total_count: int | None = None,
        warning: str | None = None,
    ) -> None:
        await self.crud.fail_job(job_id, error, fetched_count, total_count, warning)

    async def save_friends_batch(self, job_id: uuid.UUID, records: list[dict]) -> None:
        await self.crud.save_friends_batch(job_id, records)

    async def get_job_by_id(self, job_id: uuid.UUID) -> OkFriendsExportJob | None:
        return await self.crud.get_job_by_id(job_id)

    async def get_job_logs(self, job_id: uuid.UUID, limit: int = 200) -> list[OkFriendsJobLog]:
        return await self.crud.get_job_logs(job_id, limit)

    async def run_export_job(self, job_id: uuid.UUID, params: dict) -> None:
        await self.runner.run_export_job(job_id, params)
