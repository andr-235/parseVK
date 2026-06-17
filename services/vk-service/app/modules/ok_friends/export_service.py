import logging
import uuid
from typing import Any

from app.modules.ok_friends.exporter import (
    EXPORT_BATCH_SIZE,
    flatten_user_info,
)

logger = logging.getLogger(__name__)

DEFAULT_PAGE_SIZE = 1000
MAX_FRIENDS_LIMIT = 5000
MAX_UIDS_PER_REQUEST = 100

OK_USERS_GET_INFO_FIELDS = [
    "accessible", "age", "allowed_for_ads_vk", "allows_anonym_access",
    "allows_messaging_only_for_friends", "allow_add_to_friend", "badge",
    "become_vip_allowed", "bio", "birthday", "blocked", "blocks",
    "block_on_demand", "bookmarked", "business", "can_use_referral_invite",
    "can_vcall", "can_vmail", "city_of_birth", "close_comments_allowed",
    "common_friends_count", "current_location", "current_status",
    "current_status_date", "current_status_date_ms", "current_status_id",
    "current_status_mood", "current_status_track_id", "dzen_token", "email",
    "executor", "external_share_link", "first_name",
    "first_name_instrumental", "followers_count", "forbids_mentioning",
    "friend", "friends_count", "friend_invitation", "friend_invite_allowed",
    "gender", "group_invite_allowed", "has_daily_photo", "has_email",
    "has_groups_to_comment", "has_moderating_groups", "has_phone",
    "has_pinned_feed", "has_products", "has_service_invisible",
    "hobby_expert", "hobby_topic", "internal_pic_allow_empty",
    "invited_by_friend", "is_merchant", "last_name",
    "last_name_instrumental", "last_online", "last_online_ms", "locale",
    "location", "location_of_birth", "modified_ms", "name",
    "name_instrumental", "new_user", "nn_photo_set_ids", "odkl_block_reason",
    "odkl_email", "odkl_login", "odkl_mobile", "odkl_mobile_activation_date",
    "odkl_mobile_status", "odkl_user_options", "odkl_user_status",
    "odkl_voting", "online", "partner_link_create_allowed", "photo_id",
    "pic1024x768", "pic128max", "pic128x128", "pic180min", "pic190x190",
    "pic224x224", "pic240min", "pic288x288", "pic320min", "pic50x50",
    "pic600x600", "pic640x480", "picgif", "picmp4", "picwebm", "pic_1",
    "pic_2", "pic_3", "pic_4", "pic_5", "pic_base", "pic_full", "pic_max",
    "possible_relations", "premium", "presents", "private", "profile_buttons",
    "profile_cover", "profile_photo_suggest_allowed", "pymk_pic224x224",
    "pymk_pic288x288", "pymk_pic600x600", "pymk_pic_full", "ref",
    "registered_date", "registered_date_ms", "relations", "relationship",
    "returning", "rkn_mark", "send_message_allowed", "shortname", "show_lock",
    "skill", "status", "total_photos_count", "uid",
    "update_photos_with_me_checked_time", "url_chat", "url_chat_mobile",
    "url_profile", "url_profile_mobile", "vip", "vk_id",
]


class OkFriendsExportJobRunner:
    def __init__(
        self,
        *,
        append_log: Any,
        update_progress: Any,
        complete_job: Any,
        fail_job: Any,
        save_friends_batch: Any,
        get_ok_client: Any,
    ) -> None:
        self._append_log = append_log
        self._update_progress = update_progress
        self._complete_job = complete_job
        self._fail_job = fail_job
        self._save_friends_batch = save_friends_batch
        self._get_ok_client = get_ok_client

    async def run_export_job(self, job_id: uuid.UUID, params: dict) -> None:
        ok_client = self._get_ok_client()
        fid = params.get("fid")

        base_offset = params.get("offset") or 0
        requested_limit = params.get("limit")
        normalized_page_size = DEFAULT_PAGE_SIZE

        friend_ids = []
        total_count = 0
        fetched_count = 0
        warning = None
        limit_applied = False
        offset = base_offset

        async def log(level: str, msg: str, meta: Any = None) -> None:
            await self._append_log(job_id, level, msg, meta)
            logger.info(f"OK Job {job_id}: [{level.upper()}] {msg}")

        try:
            if requested_limit is not None and requested_limit <= 0:
                await log("info", "friends.get finish (fetched=0, total=0)")
                await self._complete_job(job_id, 0, 0, None, "")
                return

            await log("info", f"friends.get start (offset={offset}, limit={requested_limit or 'none'})")
            while True:
                request_limit = normalized_page_size
                if requested_limit is not None:
                    remaining = requested_limit - fetched_count
                    if remaining <= 0:
                        break
                    request_limit = min(normalized_page_size, remaining)

                api_params = {"offset": offset, "limit": request_limit}
                if fid:
                    api_params["fid"] = fid

                await log("info", f"Calling friends.get (offset={offset}, limit={request_limit})")
                try:
                    page_friends = await ok_client.friends_get(**api_params)
                except Exception as exc:
                    err_msg = str(exc)
                    await log("error", f"OK API error: {err_msg}")
                    raise

                if total_count == 0 and page_friends:
                    total_count = len(page_friends)
                    if len(page_friends) >= MAX_FRIENDS_LIMIT:
                        limit_applied = True
                        warning = f"OK limit: максимум {MAX_FRIENDS_LIMIT} друзей для обычных пользователей. Возможно, есть еще друзья."
                        await log("warn", warning)

                if page_friends:
                    friend_ids.extend(page_friends)

                fetched_count += len(page_friends)
                await self._update_progress(job_id, fetched_count, total_count or fetched_count, warning)
                await log("info", f"friends.get page fetched (offset={offset}, items={len(page_friends)}, total={total_count or fetched_count})")

                if not page_friends:
                    break
                if len(page_friends) < request_limit:
                    break

                offset += len(page_friends)

                if limit_applied and fetched_count >= MAX_FRIENDS_LIMIT:
                    break

            await log("info", f"friends.get finish (fetched={fetched_count}, total={total_count or fetched_count})")

            enriched_users = []
            total_users = len(friend_ids)
            await log("info", f"users.getInfo start (total users: {total_users})")

            fields_str = ",".join(OK_USERS_GET_INFO_FIELDS)

            for i in range(0, total_users, MAX_UIDS_PER_REQUEST):
                batch = friend_ids[i : i + MAX_UIDS_PER_REQUEST]
                batch_number = (i // MAX_UIDS_PER_REQUEST) + 1
                total_batches = (total_users + MAX_UIDS_PER_REQUEST - 1) // MAX_UIDS_PER_REQUEST

                await log("info", f"users.getInfo batch {batch_number}/{total_batches} ({len(batch)} users)")
                try:
                    users_data = await ok_client.users_get_info(batch, fields_str)
                    enriched_users.extend(users_data)
                    await log("info", f"users.getInfo batch {batch_number}/{total_batches} completed ({len(users_data)} users returned)")
                except Exception as exc:
                    err_msg = str(exc)
                    await log("warn", f"users.getInfo batch {batch_number}/{total_batches} failed: {err_msg}")

            await log("info", f"users.getInfo finish (processed: {len(friend_ids)}, returned: {len(enriched_users)})")

            records = []
            for user in enriched_users:
                uid = user.get("uid")
                if uid:
                    try:
                        records.append({"okFriendId": int(uid), "payload": user})
                    except ValueError:
                        continue

            for i in range(0, len(records), EXPORT_BATCH_SIZE):
                chunk = records[i : i + EXPORT_BATCH_SIZE]
                await self._save_friends_batch(job_id, chunk)

            await log("info", f"Saved friend records: {len(records)}")

            await log("info", "Generating XLSX file")
            flat_rows = [flatten_user_info(user) for user in enriched_users]

            from app.modules.ok_friends.exporter import write_xlsx_file
            xlsx_path = write_xlsx_file(str(job_id), flat_rows)
            await log("info", "XLSX generated", {"path": xlsx_path})

            await self._complete_job(job_id, fetched_count, total_count or fetched_count, warning, xlsx_path)
            await log("info", "Export completed")

        except Exception as exc:
            err_msg = str(exc)
            await self._fail_job(job_id, err_msg, fetched_count, total_count or fetched_count, warning)
            await log("error", f"Export failed: {err_msg}")
