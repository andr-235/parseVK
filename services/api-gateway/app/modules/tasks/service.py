from fastapi import HTTPException, Request, status

from app.clients.tasks.client import TasksClient, TasksClientHTTPError, TasksClientUnavailableError
from app.modules.auth.router import bearer_token, get_auth_service, request_ids
from app.modules.auth.service import GatewayAuthService


class TasksGatewayService:
    def __init__(self, tasks_client: TasksClient, auth_service: GatewayAuthService):
        self.tasks_client = tasks_client
        self.auth_service = auth_service

    async def forward(
        self,
        request: Request,
        method: str,
        path: str,
        *,
        json: dict | None = None,
        params: dict | None = None,
    ):
        authorization = request.headers.get("Authorization")
        try:
            claims = await self.auth_service.validate_token(bearer_token(authorization))
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized") from exc

        request_id, correlation_id = request_ids(request)
        try:
            return await self.tasks_client.request(
                method,
                path,
                user_id=str(claims["sub"]),
                request_id=request_id,
                correlation_id=correlation_id,
                json=json,
                params=params,
            )
        except TasksClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except TasksClientUnavailableError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Tasks service error") from exc


def get_tasks_gateway_service() -> TasksGatewayService:
    return TasksGatewayService(TasksClient(), get_auth_service())
