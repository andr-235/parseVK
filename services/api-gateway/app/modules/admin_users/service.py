from typing import Any

from app.clients.identity.client import IdentityClient
from app.core.exceptions import BackendServiceError, BackendUnavailableError
from app.modules._base import forward_service_request, translate_gateway_error


class AdminUsersGatewayService:
    def __init__(self, client: IdentityClient | None = None):
        self.client = client or IdentityClient()

    async def request(
        self,
        method: str,
        path: str,
        *,
        user_id: str,
        request_id: str | None,
        correlation_id: str | None,
        params: dict | None = None,
        json: Any | None = None,
    ) -> Any:
        try:
            return await forward_service_request(
                self.client,
                method,
                path,
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                params=params,
                json=json,
            )
        except (BackendServiceError, BackendUnavailableError) as exc:
            raise translate_gateway_error(exc) from exc
