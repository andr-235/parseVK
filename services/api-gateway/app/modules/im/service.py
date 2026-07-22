from app.clients.base import ServiceClient
from app.core.config import settings
from app.modules._base import BaseGatewayService
from app.modules.auth.service import GatewayAuthService


class ImGatewayService(BaseGatewayService):
    def __init__(self, client: ServiceClient | None = None, auth_service: GatewayAuthService | None = None):
        super().__init__(
            client or ServiceClient(service_name="IM", base_url=settings.im_base_url, internal_token=settings.internal_service_token),
            auth_service,
        )


def get_im_gateway_service() -> ImGatewayService:
    return ImGatewayService()


class SearchGatewayService(BaseGatewayService):
    """Gateway service for IM search endpoints (backed by content-service after PR-C4)."""

    def __init__(self, client: ServiceClient | None = None, auth_service: GatewayAuthService | None = None):
        from httpx import Timeout

        super().__init__(
            client or ServiceClient(
                service_name="Content-Search",
                base_url=settings.content_base_url,
                internal_token=settings.internal_service_token,
                timeout=Timeout(timeout=10.0, connect=2.0, read=10.0, write=5.0),
            ),
            auth_service,
        )


def get_search_gateway_service() -> SearchGatewayService:
    return SearchGatewayService()
