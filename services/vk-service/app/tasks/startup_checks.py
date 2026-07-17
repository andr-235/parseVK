import asyncio
import logging

from app.domain.exceptions.vk_api import VkApiAuthError
from app.infrastructure.ok_client.client import OkApiClient
from app.infrastructure.vk_client.client import VkApiClient, VkApiConfigurationError

logger = logging.getLogger(__name__)


def schedule_startup_checks() -> None:
    asyncio.create_task(_check_vk_token())
    asyncio.create_task(_check_ok_credentials())


async def _check_vk_token() -> None:
    try:
        client = VkApiClient()
        await client._call("users.get", user_ids="1")
        logger.info("VK token test OK — token is valid")
    except VkApiAuthError as error:
        logger.critical(
            "VK token test FAILED with auth error [%d]: %s. "
            "The VK application or token is invalid/blocked.",
            error.code,
            error.error_msg,
        )
    except VkApiConfigurationError as error:
        logger.warning("VK token test skipped: %s", error)
    except Exception as error:
        logger.warning("VK token test could not complete: %s", error)


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
