"""Per-task binding of the shared VK client facade for the task worker."""

import logging

from app.domain.exceptions.provider_account import ProviderAccountBlockedError
from app.infrastructure.vk_client.client import BoundVkApiClient, ProviderRequestContext

logger = logging.getLogger("vk-service.task-worker")


def bind_task_vk_client(vk_client, task_run) -> BoundVkApiClient:
    """Bind one execution to the provider credential captured during claim."""
    if not task_run.provider_account_key or not task_run.credential_version:
        raise ProviderAccountBlockedError(
            "task execution has no provider credential snapshot"
        )
    logger.debug(
        "binding vk client account=%s lane=%s credential=%s",
        task_run.provider_account_key,
        task_run.run_id,
        task_run.credential_version[:12],
    )
    return vk_client.bind(
        ProviderRequestContext(
            account_id=task_run.provider_account_key,
            credential_version=task_run.credential_version,
            lane_id=task_run.run_id,
        )
    )
