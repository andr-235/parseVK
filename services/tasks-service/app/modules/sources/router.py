"""Sources and task-source endpoints (gated behind ``sources_api_enabled``).

Access-scope endpoints are included via ``scopes.py``. Three-tier:
Router -> Service -> Repository; routers carry no business logic.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_sources_service
from app.core.security import require_internal_token, require_owner_user_id
from app.modules.sources.errors import TaskNotFoundError
from app.modules.sources.helpers import map_source_error, require_sources_enabled
from app.modules.sources.resolver import SourceNotFoundError as ResolverNotFoundError
from app.modules.sources.schemas import (
    CreateSourceRequest,
    SourceListResponse,
    SourceResponse,
    TaskSourceRequest,
)
from app.modules.sources.scopes import router as scopes_router
from app.modules.sources.service import SourcesService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/internal",
    tags=["sources"],
    dependencies=[Depends(require_internal_token)],
)
router.include_router(scopes_router)


def _reject_unresolved(exc: ResolverNotFoundError, context: str) -> HTTPException:
    logger.warning("Rejected untrusted identity on %s (%s)", context, exc)
    return HTTPException(
        status_code=422,
        detail="Source identity failed resolver validation",
    )


@router.get(
    "/sources",
    response_model=SourceListResponse,
    dependencies=[Depends(require_sources_enabled)],
)
async def list_sources(
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: SourcesService = Depends(get_sources_service),
):
    sources, total = await service.list_sources(owner_user_id)
    logger.info("Listed sources: owner=%s count=%d", owner_user_id, total)
    return SourceListResponse(sources=sources, total=total)


@router.post(
    "/sources",
    response_model=SourceResponse,
    dependencies=[Depends(require_sources_enabled)],
)
async def create_source(
    payload: CreateSourceRequest,
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: SourcesService = Depends(get_sources_service),
):
    try:
        source = await service.create_source(owner_user_id, payload)
    except ResolverNotFoundError as exc:
        raise _reject_unresolved(exc, f"create external={payload.external_id}") from exc
    logger.info("Created source: external=%s", payload.external_id)
    return source


@router.get(
    "/tasks/{task_id}/sources",
    response_model=SourceListResponse,
    dependencies=[Depends(require_sources_enabled)],
)
async def list_task_sources(
    task_id: int,
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: SourcesService = Depends(get_sources_service),
):
    try:
        sources = await service.list_task_sources(owner_user_id, task_id)
    except TaskNotFoundError as exc:
        raise map_source_error(exc) from exc
    logger.info("Listed task sources: task=%s count=%d", task_id, len(sources))
    return SourceListResponse(sources=sources, total=len(sources))


@router.post(
    "/tasks/{task_id}/sources",
    response_model=SourceResponse,
    dependencies=[Depends(require_sources_enabled)],
)
async def attach_task_source(
    task_id: int,
    payload: TaskSourceRequest,
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: SourcesService = Depends(get_sources_service),
):
    try:
        source = await service.attach_source_to_task(owner_user_id, task_id, payload)
    except TaskNotFoundError as exc:
        raise map_source_error(exc) from exc
    except ResolverNotFoundError as exc:
        raise _reject_unresolved(
            exc, f"attach task={task_id} external={payload.external_id}"
        ) from exc
    logger.info("Attached task source: task=%s external=%s", task_id, payload.external_id)
    return source
