from datetime import UTC, datetime

from app.db.models import ContentGroup
from app.modules.content.schemas import dt


def normalize_group_fields(group: dict) -> dict:
    def val(k_snake: str, k_camel: str):
        return (
            group.get(k_snake)
            if group.get(k_snake) is not None
            else group.get(k_camel)
        )

    return {
        "vk_group_id": int(group["id"]),
        "screen_name": val("screen_name", "screenName"),
        "name": group.get("name"),
        "is_closed": val("is_closed", "isClosed"),
        "deactivated": group.get("deactivated"),
        "type": group.get("type"),
        "photo_50": val("photo_50", "photo50"),
        "photo_100": val("photo_100", "photo100"),
        "photo_200": val("photo_200", "photo200"),
        "activity": group.get("activity"),
        "age_limits": val("age_limits", "ageLimits"),
        "description": group.get("description"),
        "members_count": val("members_count", "membersCount"),
        "status": group.get("status"),
        "verified": group.get("verified"),
        "wall": group.get("wall"),
        "addresses": group.get("addresses"),
        "city": group.get("city"),
        "counters": group.get("counters"),
        "updated_at": datetime.now(UTC),
    }


def group_to_dict(row: ContentGroup) -> dict:
    return {
        "id": row.id,
        "vkId": row.vk_group_id,
        "vkGroupId": row.vk_group_id,
        "screenName": row.screen_name,
        "name": row.name,
        "isClosed": row.is_closed,
        "deactivated": row.deactivated,
        "type": row.type,
        "photo50": row.photo_50,
        "photo100": row.photo_100,
        "photo200": row.photo_200,
        "activity": row.activity,
        "ageLimits": row.age_limits,
        "description": row.description,
        "membersCount": row.members_count,
        "status": row.status,
        "verified": row.verified,
        "wall": row.wall,
        "addresses": row.addresses,
        "city": row.city,
        "counters": row.counters,
        "createdAt": dt(row.updated_at),
        "lastCollectedAt": dt(row.last_collected_at),
        "updatedAt": dt(row.updated_at),
    }


def get_group_order(sort_by: str | None, sort_order: str):
    direction = sort_order if sort_order in {"asc", "desc"} else "desc"
    fields = {
        "name": ContentGroup.name,
        "screenName": ContentGroup.screen_name,
        "updatedAt": ContentGroup.updated_at,
        "vkId": ContentGroup.vk_group_id,
        "vkGroupId": ContentGroup.vk_group_id,
    }
    field = fields.get(sort_by or "updatedAt", ContentGroup.updated_at)
    primary = (
        field.asc().nulls_last()
        if direction == "asc"
        else field.desc().nulls_last()
    )
    return primary, ContentGroup.id.desc()
