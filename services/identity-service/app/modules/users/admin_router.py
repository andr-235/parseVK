from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_internal_token
from app.db.session import get_session
from app.modules.users.repository import UsersRepository
from app.modules.users.schemas import CreateUserRequest, TemporaryPasswordResponse, UpdateUserRequest, UserResponse
from app.modules.users.service import UsersService

router = APIRouter(prefix="/internal/admin/users", tags=["admin-users"])


async def get_users_service(session: AsyncSession = Depends(get_session)) -> UsersService:
    return UsersService(UsersRepository(session))


def to_response(user) -> UserResponse:
    return UserResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        is_temporary_password=False,
    )


@router.post("", response_model=UserResponse, dependencies=[Depends(require_internal_token)])
async def create_user(
    payload: CreateUserRequest,
    service: UsersService = Depends(get_users_service),
):
    user = await service.create_user(payload.username, payload.password, payload.role)
    return to_response(user)


@router.get("", response_model=list[UserResponse], dependencies=[Depends(require_internal_token)])
async def list_users(
    service: UsersService = Depends(get_users_service),
):
    users = await service.list_users()
    return [to_response(u) for u in users]


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    dependencies=[Depends(require_internal_token)],
)
async def update_user(
    user_id: UUID,
    payload: UpdateUserRequest,
    service: UsersService = Depends(get_users_service),
):
    user = await service.update_user(user_id, payload)
    return to_response(user)


@router.delete("/{user_id}", status_code=204, dependencies=[Depends(require_internal_token)])
async def delete_user(
    user_id: UUID,
    service: UsersService = Depends(get_users_service),
):
    await service.delete_user(user_id)


@router.post(
    "/{user_id}/set-temporary-password",
    response_model=TemporaryPasswordResponse,
    dependencies=[Depends(require_internal_token)],
)
async def set_temporary_password(
    user_id: UUID,
    service: UsersService = Depends(get_users_service),
):
    temp_password = await service.set_temporary_password(user_id)
    return TemporaryPasswordResponse(temporaryPassword=temp_password)


@router.post(
    "/{user_id}/reset-password",
    response_model=TemporaryPasswordResponse,
    dependencies=[Depends(require_internal_token)],
)
async def reset_password(
    user_id: UUID,
    service: UsersService = Depends(get_users_service),
):
    temp_password = await service.reset_password(user_id)
    return TemporaryPasswordResponse(temporaryPassword=temp_password)
