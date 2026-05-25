from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
async_session_maker = SessionLocal


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        async with session.begin():
            yield session
