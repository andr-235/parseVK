from app.infrastructure.db.mappers.common import serialize_datetime
from app.infrastructure.db.models import ContentAuthor


def author_to_dict(row: ContentAuthor) -> dict:
    display_name = (
        row.display_name.strip()
        if row.display_name
        else f"VK {row.vk_author_id}"
    )
    return {
        "id": row.id,
        "vkAuthorId": row.vk_author_id,
        "vkUserId": row.vk_author_id,
        "type": row.type,
        "displayName": row.display_name,
        "firstName": row.first_name or "",
        "lastName": row.last_name or "",
        "fullName": display_name,
        "photo50": row.photo_50,
        "photo100": row.photo_100,
        "photo200": row.photo_200,
        "domain": row.domain,
        "screenName": row.screen_name,
        "profileUrl": f"https://vk.com/id{row.vk_author_id}",
        "city": row.city,
        "country": row.country,
        "summary": None,
        "photosCount": None,
        "audiosCount": None,
        "videosCount": None,
        "friendsCount": None,
        "followersCount": row.followers_count,
        "lastSeenAt": None,
        "verifiedAt": serialize_datetime(row.verified_at),
        "isVerified": bool(row.verified_at),
        "createdAt": serialize_datetime(row.created_at),
        "updatedAt": serialize_datetime(row.updated_at),
    }


def get_author_order(sort_by: str | None, sort_order: str):
    direction = sort_order if sort_order in {"asc", "desc"} else "desc"
    fields = {
        "fullName": ContentAuthor.display_name,
        "firstName": ContentAuthor.first_name,
        "lastName": ContentAuthor.last_name,
        "followersCount": ContentAuthor.followers_count,
        "verifiedAt": ContentAuthor.verified_at,
        "createdAt": ContentAuthor.created_at,
        "created_at": ContentAuthor.created_at,
        "updatedAt": ContentAuthor.updated_at,
    }
    if sort_by and sort_by not in fields:
        raise ValueError(f"Unsupported author sort field: {sort_by}")
    field = fields.get(sort_by or "updatedAt", ContentAuthor.updated_at)
    primary = (
        field.asc().nulls_last()
        if direction == "asc"
        else field.desc().nulls_last()
    )
    return primary, ContentAuthor.id.desc()


def split_display_name(display_name: str) -> tuple[str, str]:
    parts = display_name.split()
    if not parts:
        return "", ""
    return parts[0], " ".join(parts[1:])


def map_profile_to_author_row(row: ContentAuthor, p: dict, now) -> None:
    vk_author_id = int(p["id"])
    first_name = p.get("first_name", "")
    last_name = p.get("last_name", "")
    row.display_name = f"{first_name} {last_name}".strip() or f"VK {vk_author_id}"
    row.first_name = first_name
    row.last_name = last_name
    row.photo_50 = p.get("photo_50")
    row.photo_100 = p.get("photo_100")
    row.photo_200 = p.get("photo_200")
    row.domain = p.get("domain")
    row.screen_name = p.get("screen_name")
    row.city = p.get("city")
    row.country = p.get("country")
    row.followers_count = p.get("followers_count")
    row.updated_at = now

