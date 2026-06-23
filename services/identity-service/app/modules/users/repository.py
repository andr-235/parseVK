from uuid import UUID

from app.db.models import ROLE_ADMIN, RefreshToken, User, utc_now
from app.modules.users.schemas import SortDirection, UserListQuery, UserSortField
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

SORT_COLUMNS = {
    UserSortField.USERNAME: User.username,
    UserSortField.ROLE: User.role,
    UserSortField.IS_ACTIVE: User.is_active,
    UserSortField.IS_TEMPORARY_PASSWORD: User.is_temporary_password,
    UserSortField.CREATED_AT: User.created_at,
}


class UsersRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_by_username(self, username: str) -> User | None:
        return await self.session.scalar(select(User).where(User.username == username))

    async def find_by_id(self, user_id: UUID) -> User | None:
        return await self.session.get(User, user_id)

    async def find_by_id_for_update(self, user_id: UUID) -> User | None:
        return await self.session.scalar(select(User).where(User.id == user_id).with_for_update())

    async def list_users(self, query: UserListQuery) -> tuple[list[User], int]:
        filters = self._filters(query)
        total = await self.session.scalar(select(func.count(User.id)).where(*filters))
        sort_column = SORT_COLUMNS[query.sort_by]
        sort_order = (
            sort_column.asc() if query.sort_dir == SortDirection.ASC else sort_column.desc()
        )
        statement = (
            select(User)
            .where(*filters)
            .order_by(sort_order, User.id.asc())
            .offset((query.page - 1) * query.page_size)
            .limit(query.page_size)
        )
        users = list((await self.session.scalars(statement)).all())
        return users, int(total or 0)

    async def lock_active_admin_ids(self) -> list[UUID]:
        rows = await self.session.scalars(
            select(User.id)
            .where(User.role == ROLE_ADMIN, User.is_active.is_(True))
            .order_by(User.id)
            .with_for_update()
        )
        return list(rows.all())

    async def save_user(self, user: User) -> None:
        self.session.add(user)
        await self.session.flush()

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

    @staticmethod
    def _filters(query: UserListQuery) -> list:
        filters = []
        if query.search:
            filters.append(User.username.contains(query.search.strip(), autoescape=True))
        if query.role is not None:
            filters.append(User.role == query.role.value)
        if query.is_active is not None:
            filters.append(User.is_active.is_(query.is_active))
        if query.is_temporary_password is not None:
            filters.append(User.is_temporary_password.is_(query.is_temporary_password))
        return filters
