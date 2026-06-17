<<<<<<< HEAD
from fastapi import HTTPException, Request, status

from app.clients.moderation.client import ModerationClient, ModerationClientHTTPError, ModerationClientUnavailableError
from app.modules.auth.router import bearer_token, get_auth_service, request_ids
=======
from app.clients.base import ServiceClient
from app.core.config import settings
from app.modules._base import BaseGatewayService
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
from app.modules.auth.service import GatewayAuthService


class PhotoAnalysisGatewayService(BaseGatewayService):
    def __init__(self, client: ServiceClient | None = None, auth_service: GatewayAuthService | None = None):
        super().__init__(
            client or ServiceClient(service_name="Moderation", base_url=settings.moderation_base_url, internal_token=settings.internal_service_token),
            auth_service,
        )


def get_photo_analysis_gateway_service() -> PhotoAnalysisGatewayService:
    return PhotoAnalysisGatewayService()
