from app.modules.telegram_tgmbase.models import (
    DlContact,
    DlImportBatch,
    DlImportFile,
    DlMatchResult,
    DlMatchRun,
    User,
)
from app.modules.telegram_tgmbase.schemas import (
    DlImportBatchSchema,
    DlImportFileSchema,
    TelegramDlImportContactSchema,
    TelegramDlMatchResultContactSchema,
    TelegramDlMatchResultSchema,
    TelegramDlMatchResultUserSchema,
    TelegramDlMatchRunSchema,
    TgmbaseCandidateSchema,
    TgmbaseProfileSchema,
)


def _dump_schema(schema) -> dict:
    return schema.model_dump(by_alias=True)


class TelegramTgmbaseMapper:
    def build_dl_contact_snapshot(self, contact: DlContact) -> dict:
        return {
            "importFileId": str(contact.import_file_id) if contact.import_file_id else None,
            "sourceRowIndex": contact.source_row_index,
            "telegramId": contact.telegram_id,
            "username": contact.username,
            "phone": contact.phone,
            "firstName": contact.first_name,
            "lastName": contact.last_name,
            "fullName": contact.full_name,
            "region": contact.region,
            "originalFileName": contact.import_file.original_file_name,
        }

    def build_user_snapshot(self, matched_user: User, related_chats: list) -> dict:
        return {
            "user_id": str(matched_user.user_id),
            "username": matched_user.username,
            "phone": matched_user.phone,
            "first_name": matched_user.first_name,
            "last_name": matched_user.last_name,
            "premium": matched_user.premium,
            "scam": matched_user.scam,
            "bot": matched_user.bot,
            "upd_date": matched_user.upd_date.isoformat() if matched_user.upd_date else None,
            "relatedChats": related_chats,
        }

    def map_batch(self, batch: DlImportBatch) -> dict:
        return _dump_schema(
            DlImportBatchSchema(
                id=str(batch.id),
                status=batch.status,
                filesTotal=batch.files_total,
                filesSuccess=batch.files_success,
                filesFailed=batch.files_failed,
            )
        )

    def map_file(self, file: DlImportFile) -> dict:
        return _dump_schema(
            DlImportFileSchema(
                id=str(file.id),
                originalFileName=file.original_file_name,
                status=file.status,
                rowsTotal=file.rows_total,
                rowsSuccess=file.rows_success,
                rowsFailed=file.rows_failed,
                isActive=file.is_active,
                replacedFileId=str(file.replaced_file_id) if file.replaced_file_id else None,
                error=file.error,
            )
        )

    def map_processed_file(self, file: dict) -> dict:
        return _dump_schema(DlImportFileSchema(**file))

    def map_contact(self, item: DlContact) -> dict:
        return _dump_schema(
            TelegramDlImportContactSchema(
                id=str(item.id),
                importFileId=str(item.import_file_id) if item.import_file_id else None,
                originalFileName=item.import_file.original_file_name,
                isActive=item.import_file.is_active,
                telegramId=item.telegram_id,
                username=item.username,
                phone=item.phone,
                firstName=item.first_name,
                lastName=item.last_name,
                description=item.description,
                region=item.region,
                joinedAt=item.joined_at.isoformat() if item.joined_at else None,
                channelsRaw=item.channels_raw,
                fullName=item.full_name,
                address=item.address,
                vkUrl=item.vk_url,
                email=item.email,
                telegramContact=item.telegram_contact,
                instagram=item.instagram,
                viber=item.viber,
                odnoklassniki=item.odnoklassniki,
                birthDateText=item.birth_date_text,
                usernameExtra=item.username_extra,
                geo=item.geo,
                sourceRowIndex=item.source_row_index,
                createdAt=item.created_at.isoformat(),
            )
        )

    def map_run(self, run: DlMatchRun) -> dict:
        return _dump_schema(
            TelegramDlMatchRunSchema(
                id=str(run.id),
                status=run.status,
                contactsTotal=run.contacts_total,
                matchesTotal=run.matches_total,
                strictMatchesTotal=run.strict_matches_total,
                usernameMatchesTotal=run.username_matches_total,
                phoneMatchesTotal=run.phone_matches_total,
                createdAt=run.created_at.isoformat(),
                finishedAt=run.finished_at.isoformat() if run.finished_at else None,
                error=run.error,
            )
        )

    def map_result(self, item: DlMatchResult) -> dict:
        dl_snapshot = item.dl_contact_snapshot or {}
        user_snapshot = item.tgmbase_user_snapshot or {}
        active_chats = [
            {
                "type": chat.chat_type,
                "peer_id": chat.peer_id,
                "title": chat.title,
            }
            for chat in item.chats
            if not chat.is_excluded
        ]
        user = None
        if item.tgmbase_user_id:
            user = TelegramDlMatchResultUserSchema(
                id=str(item.tgmbase_user_id),
                relatedChats=active_chats,
                **user_snapshot,
            )

        return _dump_schema(
            TelegramDlMatchResultSchema(
                id=str(item.id),
                runId=str(item.run_id),
                dlContactId=str(item.dl_contact_id),
                tgmbaseUserId=str(item.tgmbase_user_id) if item.tgmbase_user_id else None,
                strictTelegramIdMatch=item.strict_telegram_id_match,
                usernameMatch=item.username_match,
                phoneMatch=item.phone_match,
                chatActivityMatch=item.chat_activity_match,
                dlContact=TelegramDlMatchResultContactSchema(
                    id=str(item.dl_contact_id),
                    importFileId=dl_snapshot.get("importFileId"),
                    originalFileName=dl_snapshot.get("originalFileName"),
                    telegramId=dl_snapshot.get("telegramId"),
                    username=dl_snapshot.get("username"),
                    phone=dl_snapshot.get("phone"),
                    firstName=dl_snapshot.get("firstName"),
                    lastName=dl_snapshot.get("lastName"),
                    fullName=dl_snapshot.get("fullName"),
                    region=dl_snapshot.get("region"),
                    sourceRowIndex=dl_snapshot.get("sourceRowIndex"),
                ),
                user=user,
                createdAt=item.created_at.isoformat(),
            )
        )

    def map_candidate(self, user: User) -> dict:
        profile = self.map_profile(user)
        return _dump_schema(
            TgmbaseCandidateSchema(
                telegramId=profile["telegramId"],
                username=profile["username"],
                phoneNumber=profile["phoneNumber"],
                fullName=profile["fullName"],
            )
        )

    def map_profile(self, user: User) -> dict:
        first_name = (user.first_name or "").strip() or None
        last_name = (user.last_name or "").strip() or None
        full_name = " ".join(part for part in [first_name, last_name] if part).strip()
        if not full_name:
            full_name = user.username or str(user.user_id)

        return _dump_schema(
            TgmbaseProfileSchema(
                id=str(user.id),
                telegramId=str(user.user_id),
                username=user.username,
                phoneNumber=user.phone,
                firstName=first_name,
                lastName=last_name,
                fullName=full_name,
                bot=bool(user.bot),
                scam=bool(user.scam),
                premium=bool(user.premium),
                updatedAt=user.upd_date.isoformat() if user.upd_date else None,
            )
        )
