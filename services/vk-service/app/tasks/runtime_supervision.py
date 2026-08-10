import asyncio
import logging
from contextlib import suppress
from dataclasses import dataclass

from common.kafka.consumer import BaseEventConsumer

from app.domain.exceptions.vk_api import VkApiAuthError

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class BackgroundRuntime:
    tasks: list[asyncio.Task]
    consumers: list[BaseEventConsumer]

    async def stop(self) -> None:
        for task in self.tasks:
            task.cancel()
        for task in self.tasks:
            with suppress(asyncio.CancelledError):
                await task
        for consumer in self.consumers:
            await consumer.stop()


async def supervise(
    name: str,
    coro_factory,
    health_flag: list[bool] | None = None,
    preflight=None,
) -> None:
    retry_delay = 1
    while True:
        try:
            if health_flag is not None:
                health_flag[0] = False
            if preflight is not None:
                await preflight()
            if health_flag is not None:
                health_flag[0] = True
            await coro_factory()
            return
        except asyncio.CancelledError:
            logger.info("%s cancelled, stopping supervise", name)
            if health_flag is not None:
                health_flag[0] = False
            return
        except VkApiAuthError as error:
            logger.critical(
                "%s failed with VK API auth error [%d]: %s. Stopping retries.",
                name,
                error.code,
                error.error_msg,
            )
            if health_flag is not None:
                health_flag[0] = False
            return
        except Exception as error:
            if health_flag is not None:
                health_flag[0] = False
            logger.error(
                "%s crashed: %s. Restarting in %ds...",
                name,
                error,
                retry_delay,
            )
            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 30)
