import asyncio
from collections.abc import AsyncIterator
from typing import Any

from app.clients.vk_service.client import (
    VkServiceClient,
    VkServiceClientHTTPError,
    VkServiceClientUnavailableError,
)
from app.core.redaction import redact_secrets
from app.modules.friends_export.models import (
    DoneEventData,
    ErrorEventData,
    FriendsExportStartResponse,
    FriendsJobDetailResponse,
    FriendsJobLogEntry,
    FriendsJobState,
    JobStatus,
    LogEventData,
    ProgressEventData,
    SseDoneEvent,
    SseErrorEvent,
    SseEvent,
    SseLogEvent,
    SseProgressEvent,
)
from fastapi import HTTPException


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
            res = await self.client.request(
                "POST",
                f"{self._base_path}/export",
                user_id=self.user_id,
                request_id=self.request_id,
                correlation_id=self.correlation_id,
                json={"params": params},
            )
            return FriendsExportStartResponse(
                jobId=res["jobId"],
                status=JobStatus(res["status"]),
            )
        except VkServiceClientHTTPError as exc:
            raise HTTPException(
                status_code=exc.status_code,
                detail=redact_secrets(exc.detail),
            ) from exc
        except VkServiceClientUnavailableError as exc:
            raise HTTPException(status_code=502, detail=self.unavailable_detail) from exc

    async def get_job(self, job_id: str) -> FriendsJobDetailResponse:
        try:
            res = await self.client.request(
                "GET",
                f"{self._base_path}/jobs/{job_id}",
                user_id=self.user_id,
                request_id=self.request_id,
                correlation_id=self.correlation_id,
            )
            return FriendsJobDetailResponse(
                job=self._job_state(res["job"]),
                logs=[self._log_entry(log) for log in res["logs"]],
            )
        except VkServiceClientHTTPError as exc:
            raise HTTPException(
                status_code=exc.status_code,
                detail=redact_secrets(exc.detail),
            ) from exc
        except VkServiceClientUnavailableError as exc:
            raise HTTPException(status_code=502, detail=self.unavailable_detail) from exc

    async def stream_job(self, job_id: str) -> AsyncIterator[SseEvent]:
        emitted_logs_count = 0
        last_progress_count = -1
        max_polls = 600
        poll_count = 0

        while poll_count < max_polls:
            try:
                res = await self.client.request(
                    "GET",
                    f"{self._base_path}/jobs/{job_id}/logs/raw",
                    user_id=self.user_id,
                    request_id=self.request_id,
                    correlation_id=self.correlation_id,
                )
            except Exception as exc:
                yield SseErrorEvent(
                    data=ErrorEventData(
                        message=redact_secrets(f"Upstream connection lost: {exc}")
                    )
                )
                return

            job = res["job"]
            logs = res["logs"]
            status = job["status"]

            if len(logs) > emitted_logs_count:
                for log in logs[emitted_logs_count:]:
                    yield SseLogEvent(
                        data=LogEventData(
                            level=log["level"],
                            message=redact_secrets(log["message"]),
                            meta=log["meta"],
                        )
                    )
                emitted_logs_count = len(logs)

            fetched = job["fetchedCount"]
            total = job["totalCount"]
            limit_applied = fetched == 5000 and job.get("warning") is not None

            if fetched != last_progress_count:
                yield SseProgressEvent(
                    data=ProgressEventData(
                        fetchedCount=fetched,
                        totalCount=total,
                        limitApplied=limit_applied,
                    )
                )
                last_progress_count = fetched

            if status == JobStatus.DONE.value:
                yield SseDoneEvent(
                    data=DoneEventData(
                        jobId=job["id"],
                        fetchedCount=fetched,
                        totalCount=total,
                        warning=(
                            redact_secrets(job["warning"]) if job.get("warning") else None
                        ),
                        xlsxPath=job["xlsxPath"],
                    )
                )
                return

            if status == JobStatus.FAILED.value:
                yield SseErrorEvent(
                    data=ErrorEventData(
                        message=redact_secrets(job.get("error") or "Export failed")
                    )
                )
                return

            await asyncio.sleep(1.0)
            poll_count += 1

        yield SseErrorEvent(data=ErrorEventData(message="Export timeout exceeded"))

    async def get_xlsx_bytes(self, job_id: str) -> bytes:
        try:
            return await self.client.get_xlsx_bytes(
                job_id,
                provider=self.provider,
                user_id=self.user_id,
                request_id=self.request_id,
                correlation_id=self.correlation_id,
            )
        except VkServiceClientHTTPError as exc:
            raise HTTPException(
                status_code=exc.status_code,
                detail=redact_secrets(exc.detail),
            ) from exc
        except VkServiceClientUnavailableError as exc:
            raise HTTPException(status_code=502, detail=self.unavailable_detail) from exc

    @staticmethod
    def _job_state(job: dict[str, Any]) -> FriendsJobState:
        return FriendsJobState(
            id=job["id"],
            status=JobStatus(job["status"]),
            fetchedCount=job["fetchedCount"],
            totalCount=job["totalCount"],
            warning=redact_secrets(job["warning"]) if job.get("warning") else None,
            error=redact_secrets(job["error"]) if job.get("error") else None,
            xlsxPath=job["xlsxPath"],
            createdAt=job["createdAt"],
        )

    @staticmethod
    def _log_entry(log: dict[str, Any]) -> FriendsJobLogEntry:
        return FriendsJobLogEntry(
            id=log["id"],
            level=log["level"],
            message=redact_secrets(log["message"]),
            meta=log["meta"],
            createdAt=log["createdAt"],
        )
