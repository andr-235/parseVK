from app.clients.vk_service.client import VkServiceClient
from app.modules.friends_export.provider_adapter import ProviderFriendsAdapter


class VkFriendsAdapter(ProviderFriendsAdapter):
    """
    VK compatibility wrapper for the shared friends export adapter.

    Import path and class name are kept stable for routers and tests.
    """

    def __init__(
        self,
        client: VkServiceClient,
        user_id: str,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> None:
        super().__init__(
            provider="vk",
            unavailable_detail="VK service is unavailable",
            client=client,
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )
