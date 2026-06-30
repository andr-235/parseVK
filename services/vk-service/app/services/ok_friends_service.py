import logging
import uuid
from typing import Any

from app.domain.repositories.ok_friends import OkFriendsRepository
from app.infrastructure.ok_client.client import OkApiClient
from app.services.ok_friends.constants import (
    DEFAULT_PAGE_SIZE,
    MAX_FRIENDS_LIMIT,
    MAX_UIDS_PER_REQUEST,
    OK_USERS_GET_INFO_FIELDS,
)
from app.services.ok_friends.formatters import flatten_user_info
from app.services.ok_friends.workbook import EXPORT_BATCH_SIZE, write_xlsx_file

logger = logging.getLogger(__name__)


class OkFriendsExportService:
    def __init__(self, repo: OkFriendsRepository, ok_client: OkApiClient) -> None:
        self.repo = repo
        self.ok_client = ok_client

    async def _log(self, job_id: uuid.UUID, level: str, msg: str, meta: Any = None) -> None:
        await self.repo.append_log(job_id, level, msg, meta)
        logger.info(f"OK Job {job_id}: [{level.upper()}] {msg}")

    async def run_export_job(self, job_id: uuid.UUID, params: dict) -> None:
        requested_limit = params.get("limit")

        friend_ids = []
        total_count = 0
        warning = None

        try:
            if requested_limit is not None and requested_limit <= 0:
                await self._log(job_id, "info", "friends.get finish (fetched=0, total=0)")
                await self.repo.complete_job(job_id, 0, 0, None, "")
                return

            friend_ids, total_count, warning = await self._fetch_all_friends(job_id, params)
            
            enriched_users = await self._enrich_users(job_id, friend_ids)
            
            await self._save_to_database(job_id, enriched_users)
            
            xlsx_path = await self._generate_xlsx(job_id, enriched_users)
            
            await self.repo.complete_job(job_id, len(friend_ids), total_count or len(friend_ids), warning, xlsx_path)
            await self._log(job_id, "info", "Export completed")

        except Exception as exc:
            err_msg = str(exc)
            fetched_count = len(friend_ids)
            await self.repo.fail_job(job_id, err_msg, fetched_count, total_count or fetched_count, warning)
            await self._log(job_id, "error", f"Export failed: {err_msg}")

    async def _fetch_all_friends(self, job_id: uuid.UUID, params: dict) -> tuple[list[str], int, str | None]:
        fid = params.get("fid")
        base_offset = params.get("offset") or 0
        requested_limit = params.get("limit")

        friend_ids: list[str] = []
        total_count = 0
        fetched_count = 0
        warning = None
        limit_applied = False
        offset = base_offset

        await self._log(job_id, "info", f"friends.get start (offset={offset}, limit={requested_limit or 'none'})")
        while True:
            request_limit = DEFAULT_PAGE_SIZE
            if requested_limit is not None:
                remaining = requested_limit - fetched_count
                if remaining <= 0:
                    break
                request_limit = min(DEFAULT_PAGE_SIZE, remaining)

            api_params = {"offset": offset, "limit": request_limit}
            if fid:
                api_params["fid"] = fid

            await self._log(job_id, "info", f"Calling friends.get (offset={offset}, limit={request_limit})")
            try:
                page_friends = await self.ok_client.friends_get(**api_params)
            except Exception as exc:
                err_msg = str(exc)
                await self._log(job_id, "error", f"OK API error: {err_msg}")
                raise

            if total_count == 0 and page_friends:
                total_count = len(page_friends)
                if len(page_friends) >= MAX_FRIENDS_LIMIT:
                    limit_applied = True
                    warning = f"OK limit: максимум {MAX_FRIENDS_LIMIT} друзей для обычных пользователей. Возможно, есть еще друзья."
                    await self._log(job_id, "warn", warning)

            if page_friends:
                friend_ids.extend(page_friends)

            fetched_count += len(page_friends)
            await self.repo.update_progress(job_id, fetched_count, total_count or fetched_count, warning)
            await self._log(job_id, "info", f"friends.get page fetched (offset={offset}, items={len(page_friends)}, total={total_count or fetched_count})")

            if not page_friends:
                break
            if len(page_friends) < request_limit:
                break

            offset += len(page_friends)

            if limit_applied and fetched_count >= MAX_FRIENDS_LIMIT:
                break

        await self._log(job_id, "info", f"friends.get finish (fetched={fetched_count}, total={total_count or fetched_count})")
        return friend_ids, total_count, warning

    async def _enrich_users(self, job_id: uuid.UUID, friend_ids: list[str]) -> list[dict]:
        enriched_users = []
        total_users = len(friend_ids)
        await self._log(job_id, "info", f"users.getInfo start (total users: {total_users})")

        fields_str = ",".join(OK_USERS_GET_INFO_FIELDS)

        for i in range(0, total_users, MAX_UIDS_PER_REQUEST):
            batch = friend_ids[i : i + MAX_UIDS_PER_REQUEST]
            batch_number = (i // MAX_UIDS_PER_REQUEST) + 1
            total_batches = (total_users + MAX_UIDS_PER_REQUEST - 1) // MAX_UIDS_PER_REQUEST

            await self._log(job_id, "info", f"users.getInfo batch {batch_number}/{total_batches} ({len(batch)} users)")
            try:
                users_data = await self.ok_client.users_get_info(batch, fields_str)
                enriched_users.extend(users_data)
                await self._log(job_id, "info", f"users.getInfo batch {batch_number}/{total_batches} completed ({len(users_data)} users returned)")
            except Exception as exc:
                err_msg = str(exc)
                await self._log(job_id, "warn", f"users.getInfo batch {batch_number}/{total_batches} failed: {err_msg}")

        await self._log(job_id, "info", f"users.getInfo finish (processed: {len(friend_ids)}, returned: {len(enriched_users)})")
        return enriched_users

    async def _save_to_database(self, job_id: uuid.UUID, users: list[dict]) -> None:
        records = []
        skipped = 0
        for user in users:
            uid = user.get("uid")
            if uid:
                try:
                    records.append({"okFriendId": int(uid), "payload": user})
                except (ValueError, TypeError):
                    skipped += 1
                    continue

        if skipped:
            await self._log(job_id, "warn", f"Skipped {skipped} records with non-numeric uid")

        for i in range(0, len(records), EXPORT_BATCH_SIZE):
            chunk = records[i : i + EXPORT_BATCH_SIZE]
            saved = await self.repo.save_friends_batch(job_id, chunk)
            await self._log(job_id, "info", f"Saved friend records: {saved}")

        await self._log(job_id, "info", f"Save complete, total records: {len(records)}")

    async def _generate_xlsx(self, job_id: uuid.UUID, users: list[dict]) -> str:
        await self._log(job_id, "info", "Generating XLSX file")
        flat_rows = [flatten_user_info(user) for user in users]
        xlsx_path = write_xlsx_file(str(job_id), flat_rows)
        await self._log(job_id, "info", "XLSX generated", {"path": xlsx_path})
        return xlsx_path

    async def rebuild_xlsx(self, job_id: uuid.UUID) -> str:
        """Rebuild XLSX from stored payloads when the original file is missing."""
        await self._log(job_id, "info", "rebuilding XLSX from stored payloads")
        payloads = await self.repo.get_friend_record_payloads(job_id)
        if not payloads:
            await self._log(job_id, "warning", "no payloads found for XLSX rebuild")
            raise ValueError("No records found for XLSX rebuild")
        flat_rows = [flatten_user_info(payload) for payload in payloads]
        xlsx_path = write_xlsx_file(str(job_id), flat_rows)
        await self.repo.complete_job(job_id, len(payloads), len(payloads), None, xlsx_path)
        await self._log(job_id, "info", f"XLSX rebuilt at {xlsx_path}")
        return xlsx_path
