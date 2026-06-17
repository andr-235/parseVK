from uuid import uuid4

import httpx

from app.core.config import settings


class TasksClient:
    def __init__(
        self,
        *,
        base_url: str | None = None,
        internal_service_token: str | None = None,
        client: httpx.AsyncClient | None = None,
    ):
        self.base_url = (base_url or settings.tasks_base_url).rstrip("/")
        self.internal_service_token = internal_service_token or settings.internal_service_token
        self._client = client

    def _headers(self, request_id: str | None = None, correlation_id: str | None = None) -> dict[str, str]:
        return {
            "X-Internal-Service-Token": self.internal_service_token,
            "X-Caller-Service": "im-service",
            "X-Request-ID": request_id or str(uuid4()),
            "X-Correlation-ID": correlation_id or request_id or str(uuid4()),
        }

    async def _post(
        self, path: str, payload: dict, *, request_id: str | None = None, correlation_id: str | None = None,
    ) -> dict:
        headers = self._headers(request_id=request_id, correlation_id=correlation_id)
        if self._client is not None:
            response = await self._client.post(path, headers=headers, json=payload)
        else:
            async with httpx.AsyncClient(base_url=self.base_url, timeout=20) as client:
                response = await client.post(path, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()

    async def start_execution(
        self, task_id: int, run_id: str, *, request_id: str | None = None, correlation_id: str | None = None,
    ) -> dict:
        return await self._post(
            f"/internal/tasks/{task_id}/execution/start",
            {"runId": run_id, "worker": "im-service"},
            request_id=request_id, correlation_id=correlation_id,
        )

    async def update_progress(
        self, task_id: int, run_id: str,
        processed_items: int, total_items: int, progress: float, stats: dict,
        *, request_id: str | None = None, correlation_id: str | None = None,
    ) -> dict:
        return await self._post(
            f"/internal/tasks/{task_id}/execution/progress",
            {"runId": run_id, "processedItems": processed_items, "totalItems": total_items, "progress": progress, "stats": stats},
            request_id=request_id, correlation_id=correlation_id,
        )

    async def complete_execution(
        self, task_id: int, run_id: str,
        processed_items: int, total_items: int, stats: dict,
        *, request_id: str | None = None, correlation_id: str | None = None,
    ) -> dict:
        return await self._post(
            f"/internal/tasks/{task_id}/execution/complete",
            {"runId": run_id, "processedItems": processed_items, "totalItems": total_items, "stats": stats},
            request_id=request_id, correlation_id=correlation_id,
        )

    async def fail_execution(
        self, task_id: int, run_id: str, error: str,
        processed_items: int, total_items: int, stats: dict,
        *, request_id: str | None = None, correlation_id: str | None = None,
    ) -> dict:
        return await self._post(
            f"/internal/tasks/{task_id}/execution/fail",
            {"runId": run_id, "error": error, "processedItems": processed_items, "totalItems": total_items, "stats": stats},
            request_id=request_id, correlation_id=correlation_id,
        )
