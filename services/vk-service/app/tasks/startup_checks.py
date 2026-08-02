"""Legacy fire-and-forget startup credential checks.

VK startup validation lives in :mod:`app.tasks.provider_reconciliation`
(validated once via the fair scheduler). The OK credentials check below
stays fire-and-forget as before.
"""

import asyncio
import logging

from app.infrastructure.ok_client.client import OkApiClient

logger = logging.getLogger(__name__)


def schedule_startup_checks() -> None:
    asyncio.create_task(_check_ok_credentials())


async def _check_ok_credentials() -> None:
    try:
        client = OkApiClient()
        await client._call("users.getCurrentUser", fields="uid")
        logger.info("OK credentials test OK — access token is valid")
    except RuntimeError as error:
        logger.critical(
            "OK credentials test FAILED: %s. "
            "The OK application or access token may be invalid or blocked.",
            error,
        )
    except Exception as error:
        logger.warning("OK credentials test could not complete: %s", error)
