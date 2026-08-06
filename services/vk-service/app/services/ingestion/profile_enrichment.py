from app.domain.ports.vk_api import VkApiPort

_PROFILE_FIELDS = [
    "photo_50",
    "photo_100",
    "photo_200",
    "domain",
    "screen_name",
]


async def enrich_user_profiles(
    adapter: VkApiPort,
    profiles: dict[int, dict],
) -> None:
    missing = [
        user_id
        for user_id, profile in profiles.items()
        if user_id > 0 and not profile.get("photo_50")
    ]
    if not missing:
        return
    try:
        enriched_users = await adapter.get_users(missing, fields=_PROFILE_FIELDS)
    except Exception:
        return
    for user in enriched_users:
        user_id = user.get("id")
        if user_id in profiles:
            profiles[user_id].update(user)
