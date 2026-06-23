from uuid import UUID

from app.core.security import require_internal_token
from app.modules.users.dependencies import get_users_service
from app.modules.users.schemas import (
    CreateUserRequest,
    TemporaryPasswordResponse,
    UpdateUserRequest,
    UserListQuery,
    UserListResponse,
    UserResponse,
)
from app.modules.users.service import (
    AdminInvariantError,
    UsernameConflictError,
    UserNotFoundError,
    UsersService,
)
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status

router = APIRouter(
    prefix="/internal/admin/users",
    tags=["admin-users"],
    dependencies=[Depends(require_internal_token)],
)


def translate_error(exc: Exception) -> HTTPException:
    if isinstance(exc, UserNotFoundError):
        return HTTPException(status_code=404, detail="User not found")
    if isinstance(exc, UsernameConflictError):
        return HTTPException(status_code=409, detail="Username already exists")
    if isinstance(exc, AdminInvariantError):
        return HTTPException(
            status_code=409,
            detail="At least one active administrator must remain",
        )
    return HTTPException(status_code=500, detail="Unexpected user management error")


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: CreateUserRequest,
    actor_id: str | None = Header(default=None, alias="X-User-ID"),
    service: UsersService = Depends(get_users_service),
) -> UserResponse:
    try:
        user = await service.create_user(
            payload.username, payload.password, payload.role, actor_id=actor_id
        )
        return service.to_response(user)
    except UsernameConflictError as exc:
        raise translate_error(exc) from exc


@router.get("", response_model=UserListResponse)
async def list_users(
    query: UserListQuery = Query(),
    service: UsersService = Depends(get_users_service),
) -> UserListResponse:
    return await service.list_users(query)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    payload: UpdateUserRequest,
    actor_id: str | None = Header(default=None, alias="X-User-ID"),
    service: UsersService = Depends(get_users_service),
) -> UserResponse:
    try:
        return service.to_response(await service.update_user(user_id, payload, actor_id=actor_id))
    except (UserNotFoundError, AdminInvariantError) as exc:
        raise translate_error(exc) from exc


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    actor_id: str | None = Header(default=None, alias="X-User-ID"),
    service: UsersService = Depends(get_users_service),
) -> Response:
    try:
        await service.delete_user(user_id, actor_id=actor_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except (UserNotFoundError, AdminInvariantError) as exc:
        raise translate_error(exc) from exc


async def issue_temporary_password(
    user_id: UUID,
    service: UsersService,
    actor_id: str | None,
) -> TemporaryPasswordResponse:
    try:
        password = await service.set_temporary_password(user_id, actor_id=actor_id)
        return TemporaryPasswordResponse(temporaryPassword=password)
    except UserNotFoundError as exc:
        raise translate_error(exc) from exc


@router.post("/{user_id}/set-temporary-password", response_model=TemporaryPasswordResponse)
async def set_temporary_password(
    user_id: UUID,
    actor_id: str | None = Header(default=None, alias="X-User-ID"),
    service: UsersService = Depends(get_users_service),
) -> TemporaryPasswordResponse:
    return await issue_temporary_password(user_id, service, actor_id)


@router.post("/{user_id}/reset-password", response_model=TemporaryPasswordResponse)
async def reset_password(
    user_id: UUID,
    actor_id: str | None = Header(default=None, alias="X-User-ID"),
    service: UsersService = Depends(get_users_service),
) -> TemporaryPasswordResponse:
    return await issue_temporary_password(user_id, service, actor_id)
