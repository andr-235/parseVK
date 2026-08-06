from typing import Any


def post_author_payload(
    post: dict,
    profiles: dict[int, dict],
) -> dict | None:
    from_id = post.get("from_id")
    if from_id is None:
        return None
    return author_payload(int(from_id), profiles)


def author_payload(
    from_id: int,
    profiles: dict[int, dict] | None = None,
) -> dict[str, Any]:
    author_vk_id = int(from_id)
    profile = profiles.get(author_vk_id) if profiles else None
    if profile is None and author_vk_id < 0:
        profile = profiles.get(abs(author_vk_id)) if profiles else None
    if profile is None:
        return {
            "vk_author_id": author_vk_id,
            "type": "group" if author_vk_id < 0 else "user",
            "display_name": str(author_vk_id),
            "raw": {"from_id": from_id},
        }

    display_name = (
        profile.get("name")
        or f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip()
        or str(author_vk_id)
    )
    return {
        "vk_author_id": author_vk_id,
        "type": "group" if author_vk_id < 0 else "user",
        "display_name": display_name,
        "first_name": profile.get("first_name", ""),
        "last_name": profile.get("last_name", ""),
        "photo_50": profile.get("photo_50") or profile.get("photo"),
        "photo_100": profile.get("photo_100") or profile.get("photo"),
        "photo_200": profile.get("photo_200") or profile.get("photo"),
        "domain": profile.get("domain", ""),
        "screen_name": profile.get("screen_name", ""),
        "raw": {"from_id": from_id},
    }
