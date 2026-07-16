"""Automation scheduler background worker for tasks-service.

Periodically evaluates enabled automation settings in per-user transactions
and triggers due runs. Each owner is processed in its own database session
and transaction, so one owner's error does not affect others.
Processes at most MAX_OWNERS_PER_CYCLE owners per cycle.
"""

import asyncio
import logging

from common.runtime import WorkerHealth

from app.bootstrap import ApplicationFactory
from app.db.session import SessionLocal
from app.modules.automation.repository import AutomationRepository

logger = logging.getLogger(__name__)

MAX_OWNERS_PER_CYCLE = 100


async def run_automation_scheduler_forever(health: WorkerHealth) -> None:
    """Background worker: check and run due automation every 30 seconds.

    Algorithm:
    1. Short session -> list_enabled_owner_ids() -> close.
    2. Per owner: own session -> get_settings_by_owner -> check_and_run_due -> commit.
    3. Max MAX_OWNERS_PER_CYCLE owners per cycle.
    """
    logger.info("Automation scheduler starting (per-user transactions)")
    while True:
        try:
            # Step 1: collect enabled owner IDs (short session)
            owner_ids: list[str] = []
            async with SessionLocal() as session:
                repo = AutomationRepository(session)
                owner_ids = await repo.list_enabled_owner_ids()
                logger.debug("Found %d enabled automation owners", len(owner_ids))

            # Step 2: process each owner in its own session/transaction
            for owner_id in owner_ids[:MAX_OWNERS_PER_CYCLE]:
                try:
                    async with SessionLocal() as session:
                        async with session.begin():
                            repo = AutomationRepository(session)
                            settings = await repo.get_settings_by_owner(owner_id)
                            if settings is None:
                                logger.warning("Owner %s has no settings (race)", owner_id)
                                continue
                            factory = ApplicationFactory(session)
                            automation = factory.create_automation_service()
                            await automation.check_and_run_due(settings)
                except Exception:
                    logger.exception("Automation check failed for owner %s", owner_id)
                    continue  # don't break the loop for other owners
        except Exception as e:
            logger.exception("Automation scheduler top-level loop failed")
            health.mark_cycle_error(f"Automation scheduler cycle failed: {e}")
        health.mark_cycle_success()
        logger.debug("Automation cycle completed, next check in 30s")
        await asyncio.sleep(30)
