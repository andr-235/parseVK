import io
from collections.abc import Mapping

from openpyxl import Workbook
from openpyxl.styles import Font


class TelegramDlMatchExporter:
    async def export_run(
        self,
        run_id: str,
        results: list[dict],
        messages_by_result_id: Mapping[str, list[dict]],
    ) -> bytes:
        workbook = Workbook()
        summary = workbook.active
        summary.title = "matches"

        headers = [
            "run_id",
            "result_id",
            "dl_contact_id",
            "match_type",
            "dl_telegram_id",
            "dl_username",
            "dl_phone",
            "tgmbase_user_id",
            "tgmbase_username",
            "tgmbase_phone",
            "chats",
            "messages_count",
        ]
        summary.append(headers)
        for cell in summary[1]:
            cell.font = Font(bold=True)

        for result in results:
            dl_contact = result.get("dlContact") or {}
            user = result.get("tgmbaseUser") or {}
            chats = result.get("chats") or []
            messages = messages_by_result_id.get(str(result.get("id")), [])
            summary.append(
                [
                    run_id,
                    result.get("id"),
                    result.get("dlContactId"),
                    self._match_type(result),
                    dl_contact.get("telegramId"),
                    dl_contact.get("username"),
                    dl_contact.get("phone"),
                    user.get("userId") or result.get("tgmbaseUserId"),
                    user.get("username"),
                    user.get("phone"),
                    self._format_chats(chats),
                    sum(len(group.get("messages") or []) for group in messages),
                ]
            )

        details = workbook.create_sheet("messages")
        details.append(["result_id", "peer_id", "chat_title", "message_id", "date", "text"])
        for cell in details[1]:
            cell.font = Font(bold=True)

        for result_id, groups in messages_by_result_id.items():
            for group in groups:
                for message in group.get("messages") or []:
                    details.append(
                        [
                            result_id,
                            group.get("peerId"),
                            group.get("title"),
                            message.get("id"),
                            message.get("date"),
                            message.get("text"),
                        ]
                    )

        buffer = io.BytesIO()
        workbook.save(buffer)
        return buffer.getvalue()

    def _match_type(self, result: dict) -> str:
        types = []
        if result.get("strictTelegramIdMatch"):
            types.append("telegram_id")
        if result.get("usernameMatch"):
            types.append("username")
        if result.get("phoneMatch"):
            types.append("phone")
        return ", ".join(types)

    def _format_chats(self, chats: list[dict]) -> str:
        return "; ".join(
            f"{chat.get('type')}:{chat.get('peer_id') or chat.get('peerId')}:{chat.get('title')}"
            for chat in chats
        )