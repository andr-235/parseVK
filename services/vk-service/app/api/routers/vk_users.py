from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.api.dependencies import get_vk_client_dep
from app.core.config import settings
from app.core.security import require_internal_token
from app.domain.exceptions.vk_api import VkApiAuthError
from app.domain.ports.vk_api import VkApiPort

users_router = APIRouter(
    prefix="/users",
    tags=["vk"],
    dependencies=[Depends(require_internal_token)],
)

token_router = APIRouter(
    tags=["vk"],
    dependencies=[Depends(require_internal_token)],
)


class UsersRequest(BaseModel):
    user_ids: list[int]
    fields: list[str]


def _mask(value: str, keep: int = 4) -> str:
    if len(value) <= keep:
        return "****"
    return value[:keep] + "*" * min(len(value) - keep, 8)


@users_router.get("/{user_id}/photos")
async def get_user_photos(
    user_id: int,
    count: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    client: VkApiPort = Depends(get_vk_client_dep),
) -> list[dict]:
    return await client.get_user_photos(user_id=user_id, count=count, offset=offset)


@users_router.post("/bulk")
async def get_users(
    payload: UsersRequest,
    client: VkApiPort = Depends(get_vk_client_dep),
):
    return await client.get_users(user_ids=payload.user_ids, fields=payload.fields)


@token_router.post("/test-token")
async def test_vk_token(
    client: VkApiPort = Depends(get_vk_client_dep),
):
    try:
        await client.test_token()
        return {"status": "ok", "vkTokenMasked": _mask(settings.vk_token)}
    except VkApiAuthError as e:
        raise HTTPException(
            status_code=400,
            detail={
                "status": "auth_error",
                "code": e.code,
                "error": e.error_msg,
                "vkTokenMasked": _mask(settings.vk_token),
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "error": str(e),
            },
        )
