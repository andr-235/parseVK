import random
import string
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.models import User
from app.db.session import get_session
from app.modules.auth.router import require_internal_token
from app.modules.users.repository import UsersRepository
from app.modules.users.schemas import CreateUserRequest, TemporaryPasswordResponse, UserResponse

router = APIRouter(prefix="/internal/admin/users", tags=["admin-users"])


async def get_users_repository(session: AsyncSession = Depends(get_session)) -> UsersRepository:
    return UsersRepository(session)


def to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        created_at=user.created_at,
        is_temporary_password=False,  # This field isn't in models.py, hardcoding False
    )


def generate_temp_password(length: int = 12) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choice(chars) for _ in range(length))


@router.post(
    "",
    response_model=UserResponse,
    dependencies=[Depends(require_internal_token)],
)
async def create_user(
    payload: CreateUserRequest,
    repo: UsersRepository = Depends(get_users_repository),
):
    existing = await repo.find_by_username(payload.username)
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists")

    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=payload.role or "user",
    )
    await repo.save_user(user)
    return to_response(user)


@router.get(
    "",
    response_model=list[UserResponse],
    dependencies=[Depends(require_internal_token)],
)
async def list_users(
    repo: UsersRepository = Depends(get_users_repository),
):
    users = await repo.list_users()
    return [to_response(u) for u in users]


@router.delete(
    "/{user_id}",
    status_code=204,
    dependencies=[Depends(require_internal_token)],
)
async def delete_user(
    user_id: UUID,
    repo: UsersRepository = Depends(get_users_repository),
):
    user = await repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await repo.delete_user(user)


@router.post(
    "/{user_id}/set-temporary-password",
    response_model=TemporaryPasswordResponse,
    dependencies=[Depends(require_internal_token)],
)
async def set_temporary_password(
    user_id: UUID,
    repo: UsersRepository = Depends(get_users_repository),
):
    user = await repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    temp_password = generate_temp_password()
    user.password_hash = hash_password(temp_password)
    await repo.save_user(user)
    await repo.revoke_all_refresh_tokens(user.id)

    return TemporaryPasswordResponse(temporaryPassword=temp_password)


@router.post(
    "/{user_id}/reset-password",
    response_model=TemporaryPasswordResponse,
    dependencies=[Depends(require_internal_token)],
)
async def reset_password(
    user_id: UUID,
    repo: UsersRepository = Depends(get_users_repository),
):
    user = await repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    temp_password = generate_temp_password()
    user.password_hash = hash_password(temp_password)
    await repo.save_user(user)
    await repo.revoke_all_refresh_tokens(user.id)

    return TemporaryPasswordResponse(temporaryPassword=temp_password)
