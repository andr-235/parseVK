from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

# Инициализация внешнего движка мониторинга
monitor_engine = None
if settings.monitor_database_url:
    monitor_engine = create_async_engine(settings.monitor_database_url, pool_pre_ping=True)

# Инициализация движка tgmbase
tgmbase_engine = None
TgmbaseSessionLocal = None
if settings.tgmbase_database_url:
    # Заменяем postgresql:// на postgresql+asyncpg:// если используется async
    url = settings.tgmbase_database_url
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://")
    tgmbase_engine = create_async_engine(url, pool_pre_ping=True)
    TgmbaseSessionLocal = async_sessionmaker(tgmbase_engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        async with session.begin():
            yield session


async def get_tgmbase_session() -> AsyncGenerator[AsyncSession, None]:
    if not TgmbaseSessionLocal:
        raise ValueError("tgmbase_database_url is not configured")
    async with TgmbaseSessionLocal() as session:
        async with session.begin():
            yield session

