from typing import Annotated, Any

from app.core.utils import request_ids
from app.modules.admin_users.dependencies import (
    get_admin_users_gateway_service,
    require_admin,
)
from app.modules.admin_users.schemas import (
    CreateUserRequest,
    SortDirection,
    UpdateUserRequest,
    UserRole,
    UserSortField,
)
from app.modules.admin_users.service import AdminUsersGatewayService
from fastapi import APIRouter, Body, Depends, Query, Request, Response, status

router = APIRouter(prefix="/api/v1/admin/users", tags=["admin-users"])
AdminClaims = Annotated[dict[str, Any], Depends(require_admin)]
AdminService = Annotated[AdminUsersGatewayService, Depends(get_admin_users_gateway_service)]


def context(request: Request, claims: dict[str, Any]) -> dict[str, str | None]:
    request_id, correlation_id = request_ids(request)
    return {
        "user_id": str(claims["sub"]),
        "request_id": request_id,
        "correlation_id": correlation_id,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_user(
    request: Request,
    payload: Annotated[CreateUserRequest, Body()],
    claims: AdminClaims,
    service: AdminService,
):
    return await service.request(
        "POST",
        "/internal/admin/users",
        json=payload.model_dump(mode="json"),
        **context(request, claims),
    )


@router.get("")
async def list_users(
    request: Request,
    claims: AdminClaims,
    service: AdminService,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, alias="pageSize", ge=1, le=100),
    search: str | None = Query(default=None, max_length=64),
    role: UserRole | None = Query(default=None),
    is_active: bool | None = Query(default=None, alias="isActive"),
    is_temporary_password: bool | None = Query(default=None, alias="isTemporaryPassword"),
    sort_by: UserSortField = Query(default=UserSortField.CREATED_AT, alias="sortBy"),
    sort_dir: SortDirection = Query(default=SortDirection.DESC, alias="sortDir"),
):
    params = {
        "page": page,
        "pageSize": page_size,
        "search": search,
        "role": role.value if role else None,
        "isActive": is_active,
        "isTemporaryPassword": is_temporary_password,
        "sortBy": sort_by.value,
        "sortDir": sort_dir.value,
    }
    return await service.request(
        "GET",
        "/internal/admin/users",
        params={key: value for key, value in params.items() if value is not None},
        **context(request, claims),
    )


@router.patch("/{user_id}")
async def update_user(
    user_id: str,
    request: Request,
    payload: Annotated[UpdateUserRequest, Body()],
    claims: AdminClaims,
    service: AdminService,
):
    return await service.request(
        "PATCH",
        f"/internal/admin/users/{user_id}",
        json=payload.model_dump(mode="json", by_alias=False, exclude_none=True),
        **context(request, claims),
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    request: Request,
    claims: AdminClaims,
    service: AdminService,
) -> Response:
    await service.request("DELETE", f"/internal/admin/users/{user_id}", **context(request, claims))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


async def password_action(
    action: str,
    user_id: str,
    request: Request,
    claims: dict[str, Any],
    service: AdminUsersGatewayService,
):
    return await service.request(
        "POST",
        f"/internal/admin/users/{user_id}/{action}",
        **context(request, claims),
    )


@router.post("/{user_id}/set-temporary-password")
async def set_temporary_password(
    user_id: str, request: Request, claims: AdminClaims, service: AdminService
):
    return await password_action("set-temporary-password", user_id, request, claims, service)


@router.post("/{user_id}/reset-password")
async def reset_password(
    user_id: str, request: Request, claims: AdminClaims, service: AdminService
):
    return await password_action("reset-password", user_id, request, claims, service)
