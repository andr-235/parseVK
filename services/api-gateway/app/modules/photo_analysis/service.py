from app.clients.moderation.client import (
    ModerationClient,
    ModerationClientHTTPError,
    ModerationClientUnavailableError,
)
from app.modules.auth.router import bearer_token, get_auth_service, request_ids
from app.modules.auth.service import GatewayAuthService
from fastapi import HTTPException, Request, status


class PhotoAnalysisGatewayService:
    def __init__(self, moderation_client: ModerationClient, auth_service: GatewayAuthService):
        self.moderation_client = moderation_client
        self.auth_service = auth_service

    async def forward(self, request: Request, method: str, path: str, *, params: dict | None = None, json: dict | None = None):
        authorization = request.headers.get("Authorization")
        try:
            claims = await self.auth_service.validate_token(bearer_token(authorization))
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized") from exc

        request_id, correlation_id = request_ids(request)
        try:
            return await self.moderation_client.request(
                method,
                path,
                user_id=str(claims["sub"]),
                request_id=request_id,
                correlation_id=correlation_id,
                params=params,
                json=json,
            )
        except ModerationClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except ModerationClientUnavailableError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Moderation service error") from exc


def get_photo_analysis_gateway_service() -> PhotoAnalysisGatewayService:
    return PhotoAnalysisGatewayService(ModerationClient(), get_auth_service())
