import asyncio

from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.db.models import ROLE_ADMIN, User
from app.db.session import AsyncSessionLocal


async def seed_admin() -> None:
    async with AsyncSessionLocal() as session:
        existing = await session.scalar(select(User).where(User.username == settings.admin_username))
        if existing:
            return

        session.add(
            User(
                username=settings.admin_username,
                email=settings.admin_email,
                password_hash=hash_password(settings.admin_password),
                role=ROLE_ADMIN,
                is_active=True,
                is_superuser=True,
            )
        )
        await session.commit()


def main() -> None:
    asyncio.run(seed_admin())


if __name__ == "__main__":
    main()
