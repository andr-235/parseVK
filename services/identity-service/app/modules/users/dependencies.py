from app.db.session import get_session
from app.modules.users.repository import UsersRepository
from app.modules.users.service import UsersService
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession


async def get_users_service(
    session: AsyncSession = Depends(get_session),
) -> UsersService:
    return UsersService(UsersRepository(session))
