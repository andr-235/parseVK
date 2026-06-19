from __future__ import annotations

from typing import Any


def map_vk_group_to_item(group: dict[str, Any], exists_in_database: bool) -> dict[str, Any]:
    """Map a VK group dict to a normalized group item.

    Returns snake_case keys. CamelCase conversion is handled
    by Pydantic response schemas with alias_generator.
    """
    group_id = group.get("id")
    return {
        "id": group_id,
        "vk_id": group_id,
        "vk_group_id": group_id,
        "name": group.get("name"),
        "screen_name": group.get("screen_name"),
        "is_closed": group.get("is_closed"),
        "deactivated": group.get("deactivated"),
        "type": group.get("type"),
        "photo_50": group.get("photo_50"),
        "photo_100": group.get("photo_100"),
        "photo_200": group.get("photo_200"),
        "activity": group.get("activity"),
        "age_limits": group.get("age_limits"),
        "description": group.get("description"),
        "members_count": group.get("members_count"),
        "status": group.get("status"),
        "verified": group.get("verified"),
        "wall": group.get("wall"),
        "addresses": group.get("addresses"),
        "city": group.get("city"),
        "counters": group.get("counters"),
        "exists_in_db": exists_in_database,
    }


def group_exists_in_database(group_vk_id: int, existing_group_ids: set[int]) -> bool:
    """Check if a VK group already exists in the content database."""
    return group_vk_id in existing_group_ids
