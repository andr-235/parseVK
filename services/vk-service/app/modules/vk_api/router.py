<<<<<<< HEAD
from datetime import datetime, timezone
import re
import httpx
from fastapi import APIRouter, Depends, Query, Header, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
=======
import re
from datetime import UTC, datetime

import httpx
from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
from app.core.security import require_internal_token
from app.db.session import get_session
from app.modules.vk_api.client import VkApiClient
from app.modules.vk_api.service import VkApiService

router = APIRouter(
    prefix="/internal/vk",
    tags=["vk"],
    dependencies=[Depends(require_internal_token)],
)


class SaveGroupRequest(BaseModel):
    identifier: str


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
            
            # Ищем club/public/event ссылки
            club_match = re.search(r"vk\.com/(?:club|public|event)(\d+)", html)
            if club_match:
                return int(club_match.group(1))
                
            # Ищем "id":-XXXX
            id_match = re.search(r'"id":\s*-?(\d+)', html)
            if id_match:
                return int(id_match.group(1))
    except Exception:
        pass
    return None


async def save_single_group(
    identifier: str,
    session: AsyncSession,
    x_correlation_id: str | None = None,
) -> dict:
    parsed_identifier = normalize_identifier(identifier)
    
    client = VkApiClient()
    group_data = None
    
    # 1. Пробуем получить через VK API
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

    # 3. Сохраняем группу и отправляем событие через Outbox
    svc = VkApiService(session)
    await svc.save_group(group_data, correlation_id=x_correlation_id)

    # 4. Формируем IGroupResponse
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


@router.post("/groups/save")
async def save_group(
    payload: SaveGroupRequest,
    session: AsyncSession = Depends(get_session),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    return await save_single_group(
        identifier=payload.identifier,
        session=session,
        x_correlation_id=x_correlation_id,
    )


@router.get("/posts/{owner_id}/{post_id}/author-comments")
async def get_author_comments_for_post(
    owner_id: int,
    post_id: int,
    author_vk_id: int = Query(...),
    baseline: datetime | None = Query(default=None),
    batch_size: int = Query(default=100, ge=1, le=100),
    max_pages: int = Query(default=10, ge=1, le=100),
    thread_items_count: int = Query(default=10, ge=0, le=100),
) -> list[dict]:
    client = VkApiClient()
    return await client.get_author_comments_for_post(
        owner_id=owner_id,
        post_id=post_id,
        author_vk_id=author_vk_id,
        baseline=baseline,
        batch_size=batch_size,
        max_pages=max_pages,
        thread_items_count=thread_items_count,
    )


@router.get("/users/{user_id}/photos")
async def get_user_photos(
    user_id: int,
    count: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[dict]:
    client = VkApiClient()
    return await client.get_user_photos(user_id=user_id, count=count, offset=offset)


@router.delete("/groups/all")
async def delete_all_groups(
    session: AsyncSession = Depends(get_session),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    svc = VkApiService(session)
    group_ids = await svc.delete_all_groups(correlation_id=x_correlation_id)
    return {"count": len(group_ids)}


@router.delete("/groups/{vk_group_id}")
async def delete_group(
    vk_group_id: int,
    session: AsyncSession = Depends(get_session),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    svc = VkApiService(session)
    ok = await svc.delete_group(vk_group_id, correlation_id=x_correlation_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"status": "success"}


@router.get("/groups/search/region")
async def search_region_groups(
    query: str | None = Query(default=None),
):
    client = VkApiClient()
    try:
        return await client.search_groups_by_region(query=query)
    except ValueError as exc:
        if str(exc) == "REGION_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Region not found")
        raise


@router.post("/groups/upload")
async def upload_groups(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    identifiers = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]
    
    success = []
    failed = []
    
    seen = set()
    for identifier in identifiers:
        normalized = normalize_identifier(identifier).lower()
        if normalized in seen:
            failed.append({
                "identifier": identifier,
                "errorMessage": "Дубликат в списке идентификаторов"
            })
            continue
        seen.add(normalized)
        
        try:
            group = await save_single_group(
                identifier=identifier,
                session=session,
                x_correlation_id=x_correlation_id,
            )
            success.append(group)
        except Exception as exc:
            failed.append({
                "identifier": identifier,
                "errorMessage": str(exc)
            })
            
    return {
        "success": success,
        "failed": failed,
        "total": len(identifiers),
        "successCount": len(success),
        "failedCount": len(failed),
    }


class UsersRequest(BaseModel):
    user_ids: list[int]
    fields: list[str]


@router.post("/users/bulk")
async def get_users(
    payload: UsersRequest,
):
    client = VkApiClient()
    return await client.get_users(user_ids=payload.user_ids, fields=payload.fields)


