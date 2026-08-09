import logging
from contextlib import asynccontextmanager

from common.runtime import WorkerHealth
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.bootstrap import (
    get_provider_account_repository,
    get_secret_provider,
    get_vk_client,
)
from app.infrastructure.db.session import SessionLocal
from app.tasks.lifespan_workers import start_background_runtime
from app.tasks.provider_reconciliation import reconcile_provider_account
from app.tasks.runtime_supervision import supervise as supervise  # noqa: F401
from app.tasks.startup_checks import schedule_startup_checks

logger = logging.getLogger(__name__)

_consumer_healthy: list[bool] = [False]
_outbox_publisher_healthy: list[bool] = [False]
_staged_part_publisher_healthy: list[bool] = [False]
_execution_worker_health = WorkerHealth()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "VK service starting, token=%s",
        _token_display_version() or "(not set)",
    )
    schedule_startup_checks()
    await _reconcile_at_startup()

    session_factory: async_sessionmaker = SessionLocal
    runtime = start_background_runtime(
        session_factory,
        consumer_health=_consumer_healthy,
        outbox_health=_outbox_publisher_healthy,
        staged_publisher_health=_staged_part_publisher_healthy,
        execution_health=_execution_worker_health,
    )
    try:
        yield
    finally:
        await runtime.stop()


async def _reconcile_at_startup() -> None:
    try:
        async with SessionLocal.begin() as session:
            await reconcile_provider_account(
                get_vk_client(),
                get_secret_provider(),
                get_provider_account_repository(session),
            )
    except Exception as error:
        logger.error("startup reconciliation failed: %s", error)


def _token_display_version() -> str:
    try:
        credential = get_secret_provider().load()
        return credential.display_version if credential.raw_secret else ""
    except Exception:
        return ""


def get_consumer_healthy() -> bool:
    return _consumer_healthy[0]


def get_publisher_healthy() -> bool:
    return _outbox_publisher_healthy[0]


def get_staged_part_publisher_healthy() -> bool:
    return _staged_part_publisher_healthy[0]


def get_execution_worker_healthy() -> bool:
    return _execution_worker_health.is_healthy
