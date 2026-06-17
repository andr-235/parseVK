import asyncio
import logging
<<<<<<< HEAD
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.modules.watchlist.service import WatchlistService
=======

from app.modules.watchlist.service import WatchlistService
from sqlalchemy.ext.asyncio import async_sessionmaker
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da

logger = logging.getLogger("moderation-service.watchlist-monitor")


async def publish_watchlist_monitor_forever(session_factory: async_sessionmaker) -> None:
    logger.info("Watchlist monitor background loop started")
    while True:
        sleep_seconds = 60  # fallback sleep duration
        try:
            async with session_factory() as session:
                service = WatchlistService(session)
                await service.refresh_active_authors()

                # Fetch current settings to dynamically adjust the poll interval
                settings_rec = await service.get_or_create_settings()
                poll_interval = settings_rec.poll_interval_minutes
                sleep_seconds = max(poll_interval * 60, 30)
        except Exception:
            logger.exception("Watchlist monitor loop execution failed. Falling back to 60s sleep.")
            sleep_seconds = 60

        await asyncio.sleep(sleep_seconds)
