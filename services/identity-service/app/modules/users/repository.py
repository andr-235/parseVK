from uuid import UUID

from app.db.models import RefreshToken, User, utc_now
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class UsersRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_by_username(self, username: str) -> User | None:
        return await self.session.scalar(select(User).where(User.username == username))

    async def find_by_id(self, user_id: UUID) -> User | None:
        return await self.session.get(User, user_id)

    async def save_user(self, user: User) -> None:
        self.session.add(user)
        await self.session.flush()

    async def list_users(self) -> list[User]:
        result = await self.session.scalars(select(User).order_by(User.created_at.desc()))
        return list(result)

    async def update_user(self, user: User, updates: dict) -> User:
        for key, value in updates.items():
            setattr(user, key, value)
        await self.session.flush()
        return user

    async def delete_user(self, user: User) -> None:
        await self.session.delete(user)
        await self.session.flush()

    async def revoke_all_refresh_tokens(self, user_id: UUID) -> None:
        tokens = await self.session.scalars(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
        )
        now = utc_now()
        for token in tokens:
            token.revoked_at = now
