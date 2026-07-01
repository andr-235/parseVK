from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_vk_client_dep, get_vk_groups_service_dep
from app.api.routers._groups_utils import normalize_identifier, save_single_group
from app.api.schemas.vk_api import SaveGroupRequest
from app.core.security import require_internal_token
from app.domain.ports.vk_api import VkApiPort
from app.infrastructure.db.session import get_session
from app.services.vk_groups_service import VkGroupsService

router = APIRouter(
    prefix="/groups",
    tags=["vk"],
    dependencies=[Depends(require_internal_token)],
)


@router.post("/save")
async def save_group(
    payload: SaveGroupRequest,
    session: AsyncSession = Depends(get_session),
    client: VkApiPort = Depends(get_vk_client_dep),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    return await save_single_group(
        identifier=payload.identifier,
        session=session,
        client=client,
        x_correlation_id=x_correlation_id,
    )


@router.delete("/all")
async def delete_all_groups(
    service: VkGroupsService = Depends(get_vk_groups_service_dep),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    group_ids = await service.delete_all_groups(correlation_id=x_correlation_id)
    return {"count": len(group_ids)}


@router.delete("/{vk_group_id}")
async def delete_group(
    vk_group_id: int,
    service: VkGroupsService = Depends(get_vk_groups_service_dep),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    ok = await service.delete_group(vk_group_id, correlation_id=x_correlation_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"status": "success"}


@router.get("/search/region")
async def search_region_groups(
    query: str | None = Query(default=None),
    client: VkApiPort = Depends(get_vk_client_dep),
):
    try:
        return await client.search_groups_by_region(query=query)
    except ValueError as exc:
        if str(exc) == "REGION_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Region not found")
        raise


@router.post("/upload")
async def upload_groups(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    client: VkApiPort = Depends(get_vk_client_dep),
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
                client=client,
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
