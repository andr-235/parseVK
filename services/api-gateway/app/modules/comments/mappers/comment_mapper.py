from __future__ import annotations

import re
from typing import Any

_VK_POST_EXTERNAL_RE = re.compile(r"^vk_(-?\d+)_(\d+)$")


def parse_owner_id(post_external_key: str | None) -> int | None:
    if not post_external_key:
        return None
    m = _VK_POST_EXTERNAL_RE.match(post_external_key)
    return int(m.group(1)) if m else None


def get_owner_id(item: dict[str, Any]) -> int | None:
    return item.get("owner_id") or parse_owner_id(item.get("post_external_key"))


def format_comment_detail(
    item: dict[str, Any],
    author_profile: dict[str, Any] | None = None,
    group_profile: dict[str, Any] | None = None,
) -> dict[str, Any]:
    owner_id = get_owner_id(item)
    date = item.get("date") or item.get("created_at")
    date_str = date.isoformat() if hasattr(date, "isoformat") else str(date or "")
    author_vk_id = item.get("author_vk_id")
    return {
        "id": item["id"],
        "text": item.get("text", ""),
        "owner_id": owner_id,
        "author_vk_id": author_vk_id,
        "created_at": date_str,
        "author": {
            "display_name": author_profile.get("display_name") if author_profile else None,
            "full_name": author_profile.get("full_name") if author_profile else None,
            "profile_url": f"https://vk.com/id{author_vk_id}" if author_vk_id else None,
            "screen_name": author_profile.get("screen_name") if author_profile else None,
            "photo_50": author_profile.get("photo_50") if author_profile else None,
        },
        "group": {
            "name": group_profile.get("name"),
            "screen_name": group_profile.get("screen_name"),
            "vk_group_id": group_profile.get("vk_group_id"),
            "photo_50": group_profile.get("photo_50") if group_profile else None,
        } if group_profile else None,
        "is_read": item.get("is_read", False),
    }


def format_comment_search_item(item: dict[str, Any], query: str | None = None) -> dict[str, Any]:
    return {
        "id": item.get("id"),
        "text": item.get("text", ""),
        "author_vk_id": item.get("author_vk_id") or item.get("author_vk_id"),
        "author_name": item.get("author_name") or item.get("author_name", "Unknown"),
        "post_id": item.get("post_id") or item.get("post_id"),
        "post_text": item.get("post_text") or item.get("post_text", ""),
        "date": item.get("date") or item.get("created_at"),
        "read_status": item.get("read_status") if item.get("read_status") is not None else item.get("read_status"),
    }


def format_comment_for_group(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": item.get("id"),
        "text": item.get("text", ""),
        "author_vk_id": item.get("author_vk_id") or item.get("author_vk_id"),
        "author_name": item.get("author_name") or item.get("author_name", "Unknown"),
        "date": item.get("date") or item.get("created_at"),
        "read_status": item.get("read_status") if item.get("read_status") is not None else item.get("read_status"),
    }


def group_by_post(raw_items: list[dict[str, Any]], query: str | None = None) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}
    for item in raw_items:
        post_id = item.get("post_id") or item.get("post_id") or "unknown"
        if post_id not in grouped:
            grouped[post_id] = {
                "post_id": post_id,
                "post_text": item.get("post_text") or item.get("post_text", ""),
                "comments": [],
            }
        grouped[post_id]["comments"].append(format_comment_for_group(item))
    return list(grouped.values())
