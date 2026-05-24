import asyncio
import logging
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.modules.watchlist.service import WatchlistService

logger = logging.getLogger("moderation-service.watchlist-monitor")


async def publish_watchlist_monitor_forever(session_factory: async_sessionmaker) -> None:
    logger.info("Watchlist monitor background loop started")
    while True:
        try:
            async with session_factory() as session:
                async with session.begin():
                    service = WatchlistService(session)
                    await service.refresh_active_authors()
        except Exception:
            logger.exception("Watchlist monitor loop execution failed")

        await asyncio.sleep(60)
