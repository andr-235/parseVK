import asyncio
import logging

from app.db.session import SessionLocal
from app.modules.outbox.publisher import OutboxPublisher

logger = logging.getLogger(__name__)


async def publish_outbox_forever() -> None:
    """Background worker: publish outbox events every 2 seconds."""
    logger.info("Tasks outbox publisher starting")
    while True:
        try:
            async with SessionLocal() as session:
                async with session.begin():
                    await OutboxPublisher(session).publish_batch()
                    logger.debug("Outbox publish cycle completed")
        except Exception:
            logger.exception("tasks outbox publish loop failed")
        await asyncio.sleep(2)
