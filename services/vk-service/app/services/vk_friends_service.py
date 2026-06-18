import logging
import uuid
from collections.abc import Sequence
from typing import Any

from app.domain.models.vk_friends import VkFriendsExportJob, VkFriendsJobLog
from app.domain.repositories.vk_friends import VkFriendsRepository
from app.infrastructure.vk_client.client import VkApiClient
from app.services.vk_friends.formatters import map_vk_user_to_flat_dto
from app.services.vk_friends.workbook import EXPORT_BATCH_SIZE, write_xlsx_file

logger = logging.getLogger(__name__)

DEFAULT_PAGE_SIZE = 1000
HARD_LIMIT_WITH_FIELDS = 5000

class VkFriendsExportService:
    def __init__(self, repo: VkFriendsRepository, vk_client: VkApiClient) -> None:
        self.repo = repo
        self.vk_client = vk_client

    async def create_job(self, params: dict, vk_user_id: int | None = None) -> VkFriendsExportJob:
        return await self.repo.create_job(params, vk_user_id)

    async def append_log(self, job_id: uuid.UUID, level: str, message: str, meta: Any = None) -> None:
        # Check if the repository has append_log method, otherwise write logs
        if hasattr(self.repo, "append_log"):
            await self.repo.append_log(job_id, level, message, meta)

    async def update_progress(self, job_id: uuid.UUID, fetched_count: int, total_count: int | None = None, warning: str | None = None) -> None:
        await self.repo.update_progress(job_id, fetched_count, total_count, warning)

    async def complete_job(self, job_id: uuid.UUID, fetched_count: int, total_count: int | None, warning: str | None, xlsx_path: str) -> None:
        await self.repo.complete_job(job_id, fetched_count, total_count, warning, xlsx_path)

    async def fail_job(self, job_id: uuid.UUID, error: str, fetched_count: int, total_count: int | None = None, warning: str | None = None) -> None:
        await self.repo.fail_job(job_id, error, fetched_count, total_count, warning)

    async def save_friends_batch(self, job_id: uuid.UUID, records: list[dict]) -> None:
        await self.repo.save_friends_batch(job_id, records)

    async def get_job_by_id(self, job_id: uuid.UUID) -> VkFriendsExportJob | None:
        return await self.repo.get_job_by_id(job_id)

    async def get_job_logs(self, job_id: uuid.UUID, limit: int = 200) -> Sequence[VkFriendsJobLog]:
        return await self.repo.get_job_logs(job_id, limit)

    async def run_export_job(self, job_id: uuid.UUID, params: dict) -> None:
        user_id = params.get("user_id")

        api_params = {
            "fields": params.get("fields") or [
                "nickname", "domain", "sex", "bdate", "city", "country",
                "timezone", "photo_50", "photo_100", "photo_200_orig",
                "has_mobile", "contacts", "education", "universities",
                "relation", "status", "last_seen", "can_write_private_message",
                "can_see_all_posts", "can_post",
            ]
        }
        if user_id:
            api_params["user_id"] = user_id

        has_fields = len(api_params.get("fields", [])) > 0
        normalized_page_size = DEFAULT_PAGE_SIZE
        requested_limit = params.get("count")
        base_offset = params.get("offset") or 0

        raw_items = []
        total_count = 0
        fetched_count = 0
        warning = None
        effective_limit = None
        offset = base_offset

        async def log(level: str, msg: str, meta: Any = None) -> None:
            await self.append_log(job_id, level, msg, meta)
            logger.info(f"Job {job_id}: [{level.upper()}] {msg}")

        try:
            if requested_limit is not None and requested_limit <= 0:
                await log("info", "friends.get finish (fetched=0, total=0)")
                await self.complete_job(job_id, 0, 0, None, "")
                return

            while True:
                remaining_limit = None
                if effective_limit is not None:
                    remaining_limit = effective_limit - fetched_count
                elif requested_limit is not None:
                    remaining_limit = requested_limit - fetched_count

                if remaining_limit is not None and remaining_limit <= 0:
                    break

                request_count = normalized_page_size
                if remaining_limit is not None:
                    request_count = max(0, min(normalized_page_size, remaining_limit))

                if request_count <= 0:
                    break

                await log("info", f"Calling friends.get (offset={offset}, count={request_count})")

                try:
                    response = await self.vk_client.friends_get(
                        **{**api_params, "offset": offset, "count": request_count}
                    )
                except Exception as exc:
                    err_msg = str(exc)
                    await log("error", f"VK API error: {err_msg}")
                    raise

                if effective_limit is None:
                    total_count = response.get("count") or 0
                    hard_limit = None
                    if has_fields and total_count > HARD_LIMIT_WITH_FIELDS:
                        hard_limit = HARD_LIMIT_WITH_FIELDS

                    effective_limit = total_count
                    if requested_limit is not None:
                        effective_limit = min(effective_limit, requested_limit)
                    if hard_limit is not None:
                        effective_limit = min(effective_limit, hard_limit)

                    if hard_limit is not None and total_count > hard_limit and effective_limit == hard_limit:
                        warning = f"VK limit: при fields максимум 5000. Выгружено 5000 из {total_count}."
                        await log("warn", warning)

                items = response.get("items") or []
                page_items = items

                if effective_limit is not None:
                    remaining = effective_limit - fetched_count
                    if remaining <= 0:
                        page_items = []
                    elif len(page_items) > remaining:
                        page_items = page_items[:remaining]

                if page_items:
                    raw_items.extend(page_items)

                fetched_count += len(page_items)
                await self.update_progress(job_id, fetched_count, total_count, warning)
                await log("info", f"friends.get page fetched (offset={offset}, items={len(page_items)}, total={total_count})")

                if len(page_items) == 0:
                    break

                offset += len(items)

                if effective_limit is not None and fetched_count >= effective_limit:
                    break

                if len(items) < request_count:
                    break

            await log("info", f"Fetch completed (fetched={fetched_count}, total={total_count})")

            records = []
            skipped = 0
            for item in raw_items:
                friend_id = None
                if isinstance(item, int):
                    friend_id = item
                elif isinstance(item, dict):
                    friend_id = item.get("id")

                if friend_id is None:
                    skipped += 1
                    continue
                records.append({"vkFriendId": friend_id, "payload": item})

            if skipped > 0:
                await log("warn", f"Skipped friends without id: {skipped}")

            for i in range(0, len(records), EXPORT_BATCH_SIZE):
                chunk = records[i : i + EXPORT_BATCH_SIZE]
                await self.save_friends_batch(job_id, chunk)

            await log("info", f"Saved friend records: {len(records)}")

            await log("info", "Generating XLSX file")
            flat_rows = [map_vk_user_to_flat_dto(item) for item in raw_items]
            xlsx_path = write_xlsx_file(str(job_id), flat_rows)
            await log("info", "XLSX generated", {"path": xlsx_path})

            await self.complete_job(job_id, fetched_count, total_count, warning, xlsx_path)
            await log("info", "Export completed")

        except Exception as exc:
            err_msg = str(exc)
            await self.fail_job(job_id, err_msg, fetched_count, total_count, warning)
            await log("error", f"Export failed: {err_msg}")
