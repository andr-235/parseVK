import asyncio
import logging

from app.bootstrap import ApplicationFactory
from app.db.session import SessionLocal
from app.modules.automation.repository import AutomationRepository

logger = logging.getLogger(__name__)


async def run_automation_scheduler_forever() -> None:
    """Background worker: check and run due automation settings every 30 seconds."""
    logger.info("Automation scheduler starting")
    while True:
        try:
            async with SessionLocal() as session:
                async with session.begin():
                    automation = ApplicationFactory(session).create_automation_service()
                    settings_list = await AutomationRepository(session).list_enabled_settings()
                    for s in settings_list:
                        try:
                            await automation.check_and_run_due(s)
                        except Exception:
                            logger.exception("Automation scheduler failed for user %s", s.owner_user_id)
                    count = len(settings_list)
                    if count:
                        logger.info("Automation scheduler check: %d settings processed", count)
        except Exception:
            logger.exception("automation scheduler loop failed")
        logger.debug("Automation cycle completed, next check in 30s")
        await asyncio.sleep(30)
