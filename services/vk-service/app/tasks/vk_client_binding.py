"""Per-task binding of the shared VK client facade for the task worker."""

import logging

from app.domain.entities.provider_account import SYSTEM_VK_ACCOUNT_KEY
from app.infrastructure.vk_client.client import BoundVkApiClient, ProviderRequestContext

logger = logging.getLogger("vk-service.task-worker")


async def bind_task_vk_client(vk_client, provider_accounts_factory, session, run_id: str) -> BoundVkApiClient:
    """Bind the shared client to the system-vk account for one task execution."""
    account = await provider_accounts_factory(session).get_by_key(SYSTEM_VK_ACCOUNT_KEY)
    credential_version = (
        account.credential_version
        if account and account.credential_version
        else vk_client.credential_version
    )
    logger.debug(
        "binding vk client account=%s lane=%s credential=%s",
        SYSTEM_VK_ACCOUNT_KEY,
        run_id,
        credential_version[:12],
    )
    return vk_client.bind(
        ProviderRequestContext(
            account_id=SYSTEM_VK_ACCOUNT_KEY,
            credential_version=credential_version,
            lane_id=run_id,
        )
    )
