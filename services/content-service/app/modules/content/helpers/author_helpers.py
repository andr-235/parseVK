import asyncio

import httpx
from app.core.config import settings


async def refresh_authors_helper(repo, logger) -> int:
    vk_author_ids = await repo.get_all_author_ids()
    if not vk_author_ids:
        return 0

    user_ids = [uid for uid in vk_author_ids if uid > 0]
    if not user_ids:
        return 0

    batch_size = 500
    updated_count = 0
    fields = [
        "about", "activities", "bdate", "books", "career", "city", "connections",
        "contacts", "counters", "country", "domain", "education", "followers_count",
        "home_town", "interests", "last_seen", "maiden_name", "military", "movies",
        "music", "nickname", "occupation", "personal", "photo_50", "photo_100",
        "photo_200", "photo_200_orig", "photo_400_orig", "photo_id", "photo_max",
        "photo_max_orig", "relation", "relatives", "schools", "screen_name", "sex",
        "site", "status", "timezone", "tv", "universities",
    ]

    headers = {"X-Internal-Service-Token": settings.internal_service_token}
    vk_service_url = getattr(settings, "vk_service_base_url", "http://vk-service:8000")

    async with httpx.AsyncClient() as client:
        for i in range(0, len(user_ids), batch_size):
            chunk = user_ids[i:i + batch_size]
            try:
                resp = await client.post(
                    f"{vk_service_url}/internal/vk/users/bulk",
                    json={"user_ids": chunk, "fields": fields},
                    headers=headers,
                    timeout=10.0,
                )
                resp.raise_for_status()
                profiles = resp.json()
                updated_count += await repo.bulk_update_author_profiles(profiles)
            except Exception as exc:
                logger.warning("[FIX] Failed to refresh authors chunk starting at %d: %s", i, exc)

    logger.info("[FIX] Refreshed authors, updated count: %d", updated_count)
    return updated_count


async def enrich_author_summaries_helper(items: list[dict], photo_analysis, logger) -> None:
    if not photo_analysis:
        return
    vk_author_ids = [
        int(item["vkUserId"])
        for item in items
        if item.get("vkUserId") is not None
    ]
    if not vk_author_ids:
        return

    try:
        summaries = await asyncio.wait_for(
            photo_analysis.summaries_by_vk_author_ids(vk_author_ids),
            timeout=getattr(photo_analysis, "enrichment_budget_seconds", 2.0),
        )
        logger.debug("[FIX] Enriched %d authors with photo summaries", len(items))
    except Exception as exc:
        logger.warning("[FIX] Photo analysis enrichment failed: %s", exc)
        return

    for item in items:
        summary = summaries.get(int(item["vkUserId"]))
        if summary is not None:
            item["summary"] = summary
            item["photosCount"] = summary.get("total", item.get("photosCount"))
