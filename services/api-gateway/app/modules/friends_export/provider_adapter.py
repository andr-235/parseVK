from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

from app.clients.base import ServiceClientHTTPError, ServiceClientUnavailableError
from app.clients.vk_service.client import VkServiceClient
from app.core.exceptions import BackendServiceError, BackendUnavailableError
from app.core.redaction import redact_secrets
from app.modules._base import forward_service_request
from app.modules.friends_export.models import (
    ErrorEventData,
    FriendsExportStartResponse,
    FriendsJobDetailResponse,
    FriendsJobLogEntry,
    JobStatus,
    SseErrorEvent,
    SseEvent,
)
from app.modules.friends_export.sse_stream import parse_job_state, poll_job_stream


class ProviderFriendsAdapter:
    """Shared vk-service backed adapter for provider-specific friends export paths."""

    def __init__(
        self,
        *,
        provider: str,
        unavailable_detail: str,
        client: VkServiceClient,
        user_id: str,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> None:
        self.provider = provider
        self.unavailable_detail = unavailable_detail
        self.client = client
        self.user_id = user_id
        self.request_id = request_id
        self.correlation_id = correlation_id

    @property
    def _base_path(self) -> str:
        return f"/internal/{self.provider}/friends"

    async def start_export(self, params: dict[str, Any]) -> FriendsExportStartResponse:
        try:
            res = await forward_service_request(
                self.client,
                "POST",
                f"{self._base_path}/export",
                user_id=self.user_id,
                request_id=self.request_id,
                correlation_id=self.correlation_id,
                json={"params": params},
            )
        except BackendServiceError as exc:
            raise BackendServiceError(
                service_name=exc.service_name,
                status_code=exc.status_code,
                detail=redact_secrets(exc.detail),
            ) from exc
        except BackendUnavailableError as exc:
            raise BackendUnavailableError(
                service_name=exc.service_name,
                detail=self.unavailable_detail,
            ) from exc
        return FriendsExportStartResponse(
            jobId=res["jobId"],
            status=JobStatus(res["status"]),
        )

    async def get_job(self, job_id: str) -> FriendsJobDetailResponse:
        try:
            res = await forward_service_request(
                self.client,
                "GET",
                f"{self._base_path}/jobs/{job_id}",
                user_id=self.user_id,
                request_id=self.request_id,
                correlation_id=self.correlation_id,
            )
        except BackendServiceError as exc:
            raise BackendServiceError(
                service_name=exc.service_name,
                status_code=exc.status_code,
                detail=redact_secrets(exc.detail),
            ) from exc
        except BackendUnavailableError as exc:
            raise BackendUnavailableError(
                service_name=exc.service_name,
                detail=self.unavailable_detail,
            ) from exc

        return FriendsJobDetailResponse(
            job=parse_job_state(res["job"]),
            logs=[FriendsJobLogEntry(**log) for log in res["logs"]],
        )

    async def stream_job(self, job_id: str) -> AsyncIterator[SseEvent]:
        max_polls = 600
        poll_count = 0

        async for event in poll_job_stream(
            self.client,
            self._base_path,
            job_id,
            user_id=self.user_id,
            request_id=self.request_id,
            correlation_id=self.correlation_id,
        ):
            yield event
            poll_count += 1
            if poll_count >= max_polls:
                yield SseErrorEvent(data=ErrorEventData(message="Export timeout exceeded"))
                return

    async def get_xlsx_bytes(self, job_id: str) -> bytes:
        try:
            return await self.client.get_xlsx_bytes(
                job_id,
                provider=self.provider,
                user_id=self.user_id,
                request_id=self.request_id,
                correlation_id=self.correlation_id,
            )
        except ServiceClientHTTPError as exc:
            raise BackendServiceError(
                service_name=self.client.service_name,
                status_code=exc.status_code,
                detail=redact_secrets(exc.detail),
            ) from exc
        except ServiceClientUnavailableError as exc:
            raise BackendUnavailableError(
                service_name=self.client.service_name,
                detail=self.unavailable_detail,
            ) from exc
