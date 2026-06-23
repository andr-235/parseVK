import logging
import secrets
import string
from math import ceil
from uuid import UUID

from app.core.security import hash_password
from app.db.models import ROLE_ADMIN, User, utc_now
from app.modules.users.repository import UsersRepository
from app.modules.users.schemas import (
    UpdateUserRequest,
    UserDto,
    UserListQuery,
    UserListResponse,
    UserResponse,
    UserRole,
)

logger = logging.getLogger(__name__)


class UserNotFoundError(Exception):
    pass


class UsernameConflictError(Exception):
    pass


class AdminInvariantError(Exception):
    pass


class UsersService:
    def __init__(self, repo: UsersRepository):
        self._repo = repo

    async def create_user(
        self, username: str, password: str, role: UserRole, *, actor_id: str | None = None
    ) -> User:
        normalized = username.strip()
        if await self._repo.find_by_username(normalized):
            raise UsernameConflictError
        user = User(
            username=normalized,
            password_hash=hash_password(password),
            role=role.value,
            is_temporary_password=False,
        )
        await self._repo.save_user(user)
        logger.info("Admin user created actor_id=%s target_user_id=%s", actor_id, user.id)
        return user

    async def list_users(self, query: UserListQuery) -> UserListResponse:
        users, total = await self._repo.list_users(query)
        return UserListResponse(
            items=[self.to_response(user) for user in users],
            page=query.page,
            pageSize=query.page_size,
            total=total,
            totalPages=ceil(total / query.page_size) if total else 0,
        )

    async def update_user(
        self, user_id: UUID, data: UpdateUserRequest, *, actor_id: str | None = None
    ) -> User:
        active_admin_ids = await self._repo.lock_active_admin_ids()
        user = await self._get_locked(user_id)
        updates = data.model_dump(exclude_none=True)
        if self._removes_active_admin(user, updates):
            self._ensure_not_last_admin(user, active_admin_ids)
        normalized = {
            key: value.value if isinstance(value, UserRole) else value
            for key, value in updates.items()
        }
        updated = await self._repo.update_user(user, normalized)
        logger.info("Admin user updated actor_id=%s target_user_id=%s", actor_id, user.id)
        return updated

    async def delete_user(self, user_id: UUID, *, actor_id: str | None = None) -> None:
        active_admin_ids = await self._repo.lock_active_admin_ids()
        user = await self._get_locked(user_id)
        if user.role == ROLE_ADMIN and user.is_active:
            self._ensure_not_last_admin(user, active_admin_ids)
        await self._repo.delete_user(user)
        logger.info("Admin user deleted actor_id=%s target_user_id=%s", actor_id, user.id)

    async def set_temporary_password(self, user_id: UUID, *, actor_id: str | None = None) -> str:
        user = await self._get_locked(user_id)
        temporary_password = self._generate_temp_password()
        user.password_hash = hash_password(temporary_password)
        user.password_changed_at = utc_now()
        user.is_temporary_password = True
        await self._repo.revoke_all_refresh_tokens(user.id)
        await self._repo.save_user(user)
        logger.info("Temporary password issued actor_id=%s target_user_id=%s", actor_id, user.id)
        return temporary_password

    async def reset_password(self, user_id: UUID, *, actor_id: str | None = None) -> str:
        return await self.set_temporary_password(user_id, actor_id=actor_id)

    async def _get_locked(self, user_id: UUID) -> User:
        user = await self._repo.find_by_id_for_update(user_id)
        if not user:
            raise UserNotFoundError
        return user

    @staticmethod
    def _ensure_not_last_admin(user: User, active_admin_ids: list[UUID]) -> None:
        if user.id in active_admin_ids and len(active_admin_ids) <= 1:
            raise AdminInvariantError

    @staticmethod
    def _removes_active_admin(user: User, updates: dict) -> bool:
        return (
            user.role == ROLE_ADMIN
            and user.is_active
            and (updates.get("role") == UserRole.USER or updates.get("is_active") is False)
        )

    @staticmethod
    def _generate_temp_password(length: int = 20) -> str:
        alphabet = string.ascii_letters + string.digits
        return "".join(secrets.choice(alphabet) for _ in range(length))

    @staticmethod
    def to_response(user: User) -> UserResponse:
        return UserResponse.model_validate(user, from_attributes=True)

    @staticmethod
    def to_dto(user: User) -> UserDto:
        return UserDto(
            id=user.id,
            username=user.username,
            role=user.role,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            is_temporary_password=user.is_temporary_password,
        )
