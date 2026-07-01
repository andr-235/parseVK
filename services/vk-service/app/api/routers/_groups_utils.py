import re
from datetime import UTC, datetime

import httpx
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.ports.vk_api import VkApiPort


def normalize_identifier(identifier: str) -> str:
    trimmed = identifier.strip()
    patterns = [
        r"vk\.com/club(\d+)",
        r"vk\.com/public(\d+)",
        r"vk\.com/([a-zA-Z0-9_]+)",
        r"^club(\d+)$",
        r"^public(\d+)$",
        r"^(\d+)$",
    ]
    for pattern in patterns:
        match = re.search(pattern, trimmed)
        if match:
            return match.group(1)
    return trimmed


async def fetch_vk_id_from_public_html(screen_name: str) -> int | None:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"https://vk.com/{screen_name}",
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                follow_redirects=True,
            )
            if response.status_code != 200:
                return None
            html = response.text

            club_match = re.search(r"vk\.com/(?:club|public|event)(\d+)", html)
            if club_match:
                return int(club_match.group(1))

            id_match = re.search(r'"id":\s*-?(\d+)', html)
            if id_match:
                return int(id_match.group(1))
    except Exception:
        pass
    return None


async def save_single_group(
    identifier: str,
    session: AsyncSession,
    client: VkApiPort,
    x_correlation_id: str | None = None,
) -> dict:
    parsed_identifier = normalize_identifier(identifier)

    group_data = None

    fields = [
        "members_count",
        "city",
        "activity",
        "status",
        "verified",
        "description",
        "addresses",
        "counters",
        "photo_50",
        "photo_100",
        "photo_200",
    ]
    try:
        is_numeric = parsed_identifier.isdigit()
        if is_numeric:
            vk_id = int(parsed_identifier)
            groups = await client.get_groups([vk_id], fields=fields)
            if groups:
                group_data = groups[0]
        else:
            vk_id = await fetch_vk_id_from_public_html(parsed_identifier)
            if vk_id:
                groups = await client.get_groups([vk_id], fields=fields)
                if groups:
                    group_data = groups[0]
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Ошибка VK API: {str(exc)}"
        )

    if not group_data:
        raise HTTPException(
            status_code=404,
            detail=f"Группа '{identifier}' не найдена в VK"
        )

    from app.bootstrap import get_vk_groups_service
    svc = get_vk_groups_service(session)
    await svc.save_group(group_data, correlation_id=x_correlation_id)

    now_iso = datetime.now(UTC).isoformat()
    return {
        "id": group_data["id"],
        "vkId": group_data["id"],
        "name": group_data.get("name"),
        "screenName": group_data.get("screen_name"),
        "isClosed": group_data.get("is_closed"),
        "deactivated": group_data.get("deactivated"),
        "type": group_data.get("type"),
        "photo50": group_data.get("photo_50"),
        "photo100": group_data.get("photo_100"),
        "photo200": group_data.get("photo_200"),
        "activity": group_data.get("activity"),
        "ageLimits": group_data.get("age_limits"),
        "description": group_data.get("description"),
        "membersCount": group_data.get("members_count"),
        "status": group_data.get("status"),
        "verified": group_data.get("verified"),
        "wall": group_data.get("wall"),
        "addresses": group_data.get("addresses"),
        "city": group_data.get("city"),
        "counters": group_data.get("counters"),
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }
