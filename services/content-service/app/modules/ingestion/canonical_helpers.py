from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

_PROVIDER_FIELDS = (
    "first_name",
    "last_name",
    "photo_50",
    "photo_100",
    "photo_200",
    "domain",
    "screen_name",
)


def utcnow() -> datetime:
    return datetime.now(UTC)


def vk_timestamp(value: int | None) -> datetime | None:
    return datetime.fromtimestamp(int(value), UTC) if value is not None else None


def flatten_comments(
    comments: tuple[dict[str, Any], ...], owner_id: int, post_id: int
) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for value in comments:
        comment = dict(value)
        comment.setdefault("owner_id", owner_id)
        comment.setdefault("post_id", post_id)
        result.append(comment)
        thread = comment.get("thread")
        if isinstance(thread, dict):
            children = tuple(dict(item) for item in thread.get("items") or [])
            result.extend(flatten_comments(children, owner_id, post_id))
    return result


def author_update_fields(author: dict[str, Any]) -> set[str]:
    fields = {"type"}
    author_id = int(author["vkAuthorId"])
    display_name = author.get("displayName")
    if display_name not in (None, "", str(author_id)):
        fields.add("display_name")
    provider = dict(author.get("providerData") or {})
    fields.update(
        field for field in _PROVIDER_FIELDS if provider.get(field) not in (None, "")
    )
    return fields
