"""Access-scope endpoints (gated behind ``sources_api_enabled``).

Three-tier: Router -> Service -> Repository; routers carry no business logic.
"""

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_access_scope_service
from app.core.security import require_internal_token, require_owner_user_id
from app.modules.sources.errors import ScopeNotFoundError
from app.modules.sources.helpers import map_source_error, require_sources_enabled
from app.modules.sources.resolver import SourceNotFoundError as ResolverNotFoundError
from app.modules.sources.schemas import CreateAccessScopeRequest, GrantAccessRequest
from app.modules.sources.scope_service import AccessScopeService

logger = logging.getLogger(__name__)

# Included under the parent sources router, which owns the /internal prefix.
router = APIRouter(
    tags=["sources"],
    dependencies=[Depends(require_internal_token)],
)


def _reject_unresolved(exc: ResolverNotFoundError, scope_id: UUID) -> HTTPException:
    logger.warning(
        "Rejected untrusted identity on access change: scope=%s (%s)",
        scope_id, exc,
    )
    return HTTPException(
        status_code=422,
        detail="Source identity failed resolver validation",
    )


@router.get("/access-scopes", dependencies=[Depends(require_sources_enabled)])
async def list_access_scopes(
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: AccessScopeService = Depends(get_access_scope_service),
):
    scopes = await service.list_access_scopes(owner_user_id)
    logger.info("Listed access scopes: owner=%s count=%d", owner_user_id, len(scopes))
    return {"scopes": scopes, "total": len(scopes)}


@router.post("/access-scopes", dependencies=[Depends(require_sources_enabled)])
async def create_access_scope(
    payload: CreateAccessScopeRequest,
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: AccessScopeService = Depends(get_access_scope_service),
):
    scope = await service.create_access_scope(owner_user_id, payload)
    logger.info("Created access scope: owner=%s name=%s", owner_user_id, payload.name)
    return scope


@router.post("/access-scopes/{scope_id}/grant", dependencies=[Depends(require_sources_enabled)])
async def grant_access(
    scope_id: UUID,
    payload: GrantAccessRequest,
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: AccessScopeService = Depends(get_access_scope_service),
):
    try:
        await service.grant_access(owner_user_id, scope_id, payload)
    except ScopeNotFoundError as exc:
        raise map_source_error(exc) from exc
    except ResolverNotFoundError as exc:
        raise _reject_unresolved(exc, scope_id) from exc
    return {"status": "granted"}


@router.post("/access-scopes/{scope_id}/revoke", dependencies=[Depends(require_sources_enabled)])
async def revoke_access(
    scope_id: UUID,
    payload: GrantAccessRequest,
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: AccessScopeService = Depends(get_access_scope_service),
):
    try:
        await service.revoke_access(owner_user_id, scope_id, payload)
    except ScopeNotFoundError as exc:
        raise map_source_error(exc) from exc
    except ResolverNotFoundError as exc:
        raise _reject_unresolved(exc, scope_id) from exc
    return {"status": "revoked"}
