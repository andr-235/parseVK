from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from typing import Any

from app.clients.base import ServiceClient
from app.core.exceptions import BackendServiceError, BackendUnavailableError
from app.core.redaction import redact_secrets
from app.modules._base import forward_service_request
from app.modules.friends_export.models import (
    DoneEventData,
    ErrorEventData,
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


async def poll_job_stream(
    client: ServiceClient,
    base_path: str,
    job_id: str,
    *,
    user_id: str | None = None,
    request_id: str | None = None,
    correlation_id: str | None = None,
) -> AsyncIterator[SseEvent]:
    """Poll job logs/status and yield SSE events until terminal state."""
    emitted_logs_count = 0
    last_progress_count = -1
    max_polls = 600
    poll_count = 0

    while poll_count < max_polls:
        try:
            res = await forward_service_request(
                client,
                "GET",
                f"{base_path}/jobs/{job_id}/logs/raw",
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
            )
        except (BackendServiceError, BackendUnavailableError) as exc:
            yield SseErrorEvent(
                data=ErrorEventData(
                    message=redact_secrets(f"Upstream connection lost: {exc}"),
                ),
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
                    ),
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
                ),
            )
            last_progress_count = fetched

        if status == JobStatus.DONE.value:
            yield SseDoneEvent(
                data=DoneEventData(
                    jobId=job["id"],
                    fetchedCount=fetched,
                    totalCount=total,
                    warning=redact_secrets(job["warning"]) if job.get("warning") else None,
                    xlsxPath=job["xlsxPath"],
                ),
            )
            return

        if status == JobStatus.FAILED.value:
            yield SseErrorEvent(
                data=ErrorEventData(
                    message=redact_secrets(job.get("error") or "Export failed"),
                ),
            )
            return

        await asyncio.sleep(1.0)
        poll_count += 1

    yield SseErrorEvent(data=ErrorEventData(message="Export timeout exceeded"))


def parse_job_state(job: dict[str, Any]) -> FriendsJobState:
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
