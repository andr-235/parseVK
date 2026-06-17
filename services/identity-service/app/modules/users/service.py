import random
import string
from uuid import UUID

<<<<<<< HEAD
from fastapi import HTTPException, status

=======
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
from app.core.security import hash_password
from app.db.models import User
from app.modules.users.repository import UsersRepository
from app.modules.users.schemas import UpdateUserRequest, UserDto
<<<<<<< HEAD
=======
from fastapi import HTTPException, status
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da


class UsersService:
    def __init__(self, repo: UsersRepository):
        self._repo = repo

    async def create_user(self, username: str, password: str, role: str | None = None) -> User:
        existing = await self._repo.find_by_username(username)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

        user = User(
            username=username,
            password_hash=hash_password(password),
            role=role or "user",
        )
        await self._repo.save_user(user)
        return user

    async def list_users(self) -> list[User]:
        return await self._repo.list_users()

    async def get_user(self, user_id: UUID) -> User:
        user = await self._repo.find_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    async def update_user(self, user_id: UUID, data: UpdateUserRequest) -> User:
        user = await self.get_user(user_id)
        updates = data.model_dump(exclude_none=True)
        if not updates:
            return user
        return await self._repo.update_user(user, updates)

    async def delete_user(self, user_id: UUID) -> None:
        user = await self.get_user(user_id)
        await self._repo.delete_user(user)

    async def set_temporary_password(self, user_id: UUID) -> str:
        user = await self.get_user(user_id)
        temp_password = self._generate_temp_password()
        user.password_hash = hash_password(temp_password)
        await self._repo.save_user(user)
        await self._repo.revoke_all_refresh_tokens(user.id)
        return temp_password

    async def reset_password(self, user_id: UUID) -> str:
        return await self.set_temporary_password(user_id)

    @staticmethod
    def _generate_temp_password(length: int = 12) -> str:
        chars = string.ascii_letters + string.digits
        return "".join(random.choice(chars) for _ in range(length))

    @staticmethod
    def to_dto(user: User) -> UserDto:
        return UserDto(
            id=user.id,
            username=user.username,
            role=user.role,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
        )
