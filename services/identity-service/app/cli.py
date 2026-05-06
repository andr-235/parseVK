import asyncio

from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.db.models import ROLE_ADMIN, User
from app.db.session import AsyncSessionLocal
from app.modules.outbox.service import add_identity_event


async def seed_admin() -> None:
    async with AsyncSessionLocal() as session:
        existing = await session.scalar(select(User).where(User.username == settings.admin_username))
        if existing:
            return

        user = User(
            username=settings.admin_username,
            email=settings.admin_email,
            password_hash=hash_password(settings.admin_password),
            role=ROLE_ADMIN,
            is_active=True,
            is_superuser=True,
        )
        session.add(user)
        await session.flush()
        await add_identity_event(session, event_type="identity.user_created", user_id=str(user.id))
        await session.commit()


def main() -> None:
    asyncio.run(seed_admin())


if __name__ == "__main__":
    main()
