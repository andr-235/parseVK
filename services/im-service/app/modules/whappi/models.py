from __future__ import annotations

from datetime import datetime
from typing import Any

from app.modules.ingestion.extraction import _extract_text as _extract_text_from_extraction

WAPPI_CHATS_ENDPOINT = "/api/sync/chats/get"
WAPPI_MESSAGES_ENDPOINT = "/api/sync/messages/get"

MAX_CHATS_ENDPOINT = "/maxapi/sync/chats/get"
MAX_MESSAGES_ENDPOINT = "/maxapi/sync/messages/get"

SKIPPED_CHAT_IDS = {"status@broadcast", "0@s.whatsapp.net"}


def _coerce_timestamp(value: Any) -> int | None:
    if value is None:
        return None
    try:
        ts = int(value)
    except (TypeError, ValueError):
        return None
    if ts > 1_000_000_000_000:
        ts //= 1000
    return ts


class WappiMessage:
    def __init__(self, raw: dict, chat_id: str, chat_name: str | None):
        self.raw = raw
        self.external_id: str = str(raw.get("id") or "")
        self.chat_id: str = chat_id
        self.chat_name: str | None = chat_name
        self.sender: str | None = (
            raw.get("senderName")
            or raw.get("from_name")
            or raw.get("from")
            or raw.get("author")
        )
        self.text: str | None = self._extract_text(raw)
        ts = _coerce_timestamp(raw.get("time") or raw.get("timestamp"))
        self.created_at: datetime | None = datetime.fromtimestamp(ts) if ts else None
        self.content_url: str | None = None
        self.content_type: str | None = None

    @staticmethod
    def _extract_text(payload: dict) -> str | None:
        return _extract_text_from_extraction(payload)


class WappiChat:
    def __init__(self, raw: dict):
        self.raw = raw
        self.chat_id: str = str(raw.get("id") or "")
        self.name: str | None = self._extract_name(raw)

    @staticmethod
    def _extract_name(chat: dict) -> str | None:
        name = chat.get("name")
        if isinstance(name, str) and name.strip():
            return name.strip()
        group = chat.get("group")
        if isinstance(group, dict):
            for key in ("Name", "name", "Subject", "subject"):
                value = group.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip()
        contact = chat.get("contact")
        if isinstance(contact, dict):
            for key in ("FullName", "PushName", "FirstName", "BusinessName"):
                value = contact.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip()
        return None

    @staticmethod
    def _extract_participants(chat: dict) -> dict[str, str]:
        group = chat.get("group")
        if not isinstance(group, dict):
            return {}
        participants = group.get("Participants")
        if not isinstance(participants, list):
            return {}
        mapping: dict[str, str] = {}
        for participant in participants:
            if not isinstance(participant, dict):
                continue
            lid = (
                participant.get("JID") or participant.get("jid")
                or participant.get("LID") or participant.get("lid")
                or participant.get("id")
            )
            phone = (
                participant.get("PhoneNumber") or participant.get("phoneNumber")
                or participant.get("phone_number")
            )
            if lid and phone:
                mapping[str(lid).strip()] = str(phone).strip()
        return mapping
