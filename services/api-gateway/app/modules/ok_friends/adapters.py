import asyncio
from typing import Any, AsyncIterator

from app.clients.vk_service.client import (
    VkServiceClient,
    VkServiceClientHTTPError,
    VkServiceClientUnavailableError,
)
from fastapi import HTTPException
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
    SseLogEvent,
    SseProgressEvent,
    SseEvent,
)


class OkFriendsAdapter:
    """
    OK specific adapter for friends export.
    Acts as an HTTP proxy/translator to downstream social service (vk-service).
    """

    def __init__(
        self,
        client: VkServiceClient,
        user_id: str,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> None:
        self.client = client
        self.user_id = user_id
        self.request_id = request_id
        self.correlation_id = correlation_id

    async def start_export(self, params: dict[str, Any]) -> FriendsExportStartResponse:
        try:
            res = await self.client.request(
                "POST",
                "/internal/ok/friends/export",
                user_id=self.user_id,
                request_id=self.request_id,
                correlation_id=self.correlation_id,
                json={"params": params},
            )
            return FriendsExportStartResponse(
                jobId=res["jobId"], status=JobStatus(res["status"])
            )
        except VkServiceClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except VkServiceClientUnavailableError as exc:
            raise HTTPException(status_code=502, detail="Social service is unavailable") from exc

    async def get_job(self, job_id: str) -> FriendsJobDetailResponse:
        try:
            res = await self.client.request(
                "GET",
                f"/internal/ok/friends/jobs/{job_id}",
                user_id=self.user_id,
                request_id=self.request_id,
                correlation_id=self.correlation_id,
            )
            job = res["job"]
            logs = res["logs"]

            job_state = FriendsJobState(
                id=job["id"],
                status=JobStatus(job["status"]),
                fetchedCount=job["fetchedCount"],
                totalCount=job["totalCount"],
                warning=job["warning"],
                error=job["error"],
                xlsxPath=job["xlsxPath"],
                createdAt=job["createdAt"],
            )

            log_entries = [
                FriendsJobLogEntry(
                    id=log["id"],
                    level=log["level"],
                    message=log["message"],
                    meta=log["meta"],
                    createdAt=log["createdAt"],
                )
                for log in logs
            ]

            return FriendsJobDetailResponse(job=job_state, logs=log_entries)
        except VkServiceClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except VkServiceClientUnavailableError as exc:
            raise HTTPException(status_code=502, detail="Social service is unavailable") from exc

    async def stream_job(self, job_id: str) -> AsyncIterator[SseEvent]:
        emitted_logs_count = 0
        last_progress_count = -1
        max_polls = 600  # 10 minutes timeout
        poll_count = 0

        while poll_count < max_polls:
            try:
                res = await self.client.request(
                    "GET",
                    f"/internal/ok/friends/jobs/{job_id}/logs/raw",
                    user_id=self.user_id,
                    request_id=self.request_id,
                    correlation_id=self.correlation_id,
                )
            except Exception as exc:
                yield SseErrorEvent(
                    data=ErrorEventData(message="Upstream connection lost")
                )
                return

            job = res["job"]
            logs = res["logs"]
            status = job["status"]

            # 1. Emit new logs
            if len(logs) > emitted_logs_count:
                new_logs = logs[emitted_logs_count:]
                for log in new_logs:
                    yield SseLogEvent(
                        data=LogEventData(
                            level=log["level"],
                            message=log["message"],
                            meta=log["meta"],
                        )
                    )
                emitted_logs_count = len(logs)

            # 2. Emit progress updates if progress changed
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

            # 3. Check termination status
            if status == JobStatus.DONE.value:
                yield SseDoneEvent(
                    data=DoneEventData(
                        jobId=job["id"],
                        fetchedCount=fetched,
                        totalCount=total,
                        warning=job["warning"],
                        xlsxPath=job["xlsxPath"],
                    )
                )
                return

            if status == JobStatus.FAILED.value:
                yield SseErrorEvent(
                    data=ErrorEventData(message=job.get("error") or "Export failed")
                )
                return

            await asyncio.sleep(1.0)
            poll_count += 1

        # Timeout hit
        yield SseErrorEvent(data=ErrorEventData(message="Export timeout exceeded"))

    async def get_xlsx_bytes(self, job_id: str) -> bytes:
        try:
            return await self.client.get_xlsx_bytes(
                job_id,
                provider="ok",
                user_id=self.user_id,
                request_id=self.request_id,
                correlation_id=self.correlation_id,
            )
        except VkServiceClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except VkServiceClientUnavailableError as exc:
            raise HTTPException(status_code=502, detail="Social service is unavailable") from exc
