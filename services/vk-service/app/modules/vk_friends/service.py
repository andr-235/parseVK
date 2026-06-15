import uuid
from typing import Any

from app.modules.vk_api.client import VkApiClient
from app.modules.vk_friends.crud_service import VkFriendsCrudService
from app.modules.vk_friends.export_service import VkFriendsExportRunner


class VkFriendsExportService:
    def __init__(self, session_factory=None) -> None:
        svc = self
        self.crud = VkFriendsCrudService(session_factory)
        self._runner = VkFriendsExportRunner(
            crud=self.crud,
            get_vk_client=lambda: svc._get_vk_client(),
        )

    def _get_vk_client(self) -> Any:
        return VkApiClient()

    async def create_job(self, params: dict, vk_user_id: int | None = None):
        return await self.crud.create_job(params, vk_user_id)

    async def append_log(self, job_id, level, message, meta=None):
        return await self.crud.append_log(job_id, level, message, meta)

    async def update_progress(self, job_id, fetched_count, total_count=None, warning=None):
        return await self.crud.update_progress(job_id, fetched_count, total_count, warning)

    async def complete_job(self, job_id, fetched_count, total_count, warning, xlsx_path):
        return await self.crud.complete_job(job_id, fetched_count, total_count, warning, xlsx_path)

    async def fail_job(self, job_id, error, fetched_count, total_count=None, warning=None):
        return await self.crud.fail_job(job_id, error, fetched_count, total_count, warning)

    async def save_friends_batch(self, job_id, records):
        return await self.crud.save_friends_batch(job_id, records)

    async def get_job_by_id(self, job_id):
        return await self.crud.get_job_by_id(job_id)

    async def get_job_logs(self, job_id, limit=200):
        return await self.crud.get_job_logs(job_id, limit)

    async def run_export_job(self, job_id: uuid.UUID, params: dict) -> None:
        return await self._runner.run_export_job(job_id, params)
