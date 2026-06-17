"""
Common lifecycle coordinator for friends export (VK and OK).

Responsibilities:
  - Routing: delegate start/get/stream/download to the injected adapter.
  - SSE serialisation: convert SseEvent objects to the wire format.
  - Error shaping: wrap unexpected adapter errors as HTTP 502.
  - Download headers: set Content-Disposition and Content-Type for XLSX.

NOT responsible for:
  - Provider-specific API calls — that is the adapter's job.
  - Job persistence — owned by the downstream service called by the adapter.

Security guarantees:
  - Credentials, tokens, session keys are never logged or surfaced in
    error responses. Unexpected upstream errors are replaced with a
    generic 502 message.

Ref: FASTAPI-MIG-010B / docs/FASTAPI_MIG_010_FRIENDS_EXPORT_INVENTORY.md
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any, Literal

from app.modules.friends_export.adapters import FriendsExportAdapter
from app.modules.friends_export.models import (
    FriendsExportStartResponse,
    FriendsJobDetailResponse,
    SseEvent,
)
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

_XLSX_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)


def _serialise_sse_event(event: SseEvent) -> str:
    """Serialise a typed SseEvent to the SSE wire format: `data: <json>\\n\\n`."""
    payload = json.dumps({"type": event.type, "data": event.data.model_dump()})
    return f"data: {payload}\n\n"


class FriendsExportService:
    """
    Provider-agnostic coordinator for the friends export lifecycle.

    Inject a FriendsExportAdapter (VkFriendsAdapter or OkFriendsAdapter)
    to select the social-network provider.
    """

    def __init__(self, adapter: FriendsExportAdapter) -> None:
        self._adapter = adapter

    # ------------------------------------------------------------------ #
    #  Public lifecycle methods                                            #
    # ------------------------------------------------------------------ #

    async def start(self, params: dict[str, Any]) -> FriendsExportStartResponse:
        """
        Start a new export job.

        Re-raises HTTPException (e.g. 400 for invalid params) unchanged.
        Wraps unexpected errors as HTTP 502 — consistent with get_job()
        and download_xlsx().
        """
        try:
            return await self._adapter.start_export(params)
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail="Upstream error starting friends export",
            ) from exc

    async def get_job(self, job_id: str) -> FriendsJobDetailResponse:
        """
        Fetch current job state and logs.

        Re-raises HTTPException from the adapter unchanged (404, 400, …).
        Wraps any other exception as HTTP 502 to avoid leaking internals.
        """
        try:
            return await self._adapter.get_job(job_id)
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=502, detail="Upstream error fetching job state"
            ) from exc

    async def stream(self, job_id: str) -> StreamingResponse:
        """
        Build a StreamingResponse that forwards SSE events from the adapter.

        Pre-validates that the job exists before opening the SSE stream.
        This ensures 404/400 errors are returned as proper HTTP responses
        rather than inside a broken streaming body where FastAPI can no
        longer set the status code.

        The response media type is `text/event-stream`.
        `X-Accel-Buffering: no` disables Nginx proxy buffering so events
        reach the client immediately.
        """
        # Pre-validation: raises HTTPException(404/400/502) before the
        # streaming response is opened, so the caller gets a normal HTTP
        # error instead of a broken SSE stream.
        await self.get_job(job_id)

        async def _generate() -> AsyncIterator[str]:
            try:
                async for event in self._adapter.stream_job(job_id):
                    yield _serialise_sse_event(event)
            except Exception:
                # Emit a safe error event and close the stream rather than
                # leaking a raw exception traceback to the client.
                error_payload = json.dumps(
                    {"type": "error", "data": {"message": "Stream interrupted"}}
                )
                yield f"data: {error_payload}\n\n"

        return StreamingResponse(
            _generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    async def download_xlsx(
        self, job_id: str, provider: Literal["vk", "ok"]
    ) -> StreamingResponse:
        """
        Download the XLSX file for a completed job.

        `provider` is 'vk' or 'ok' — used only for the filename, not for
        routing (routing happens via adapter injection).

        Re-raises HTTPException from the adapter (404 if file missing).
        Wraps unexpected errors as HTTP 502.
        """
        try:
            data = await self._adapter.get_xlsx_bytes(job_id)
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=502, detail="Upstream error fetching XLSX"
            ) from exc

        filename = f"{provider}_friends_export_{job_id}.xlsx"
        return StreamingResponse(
            iter([data]),
            media_type=_XLSX_CONTENT_TYPE,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(data)),
            },
        )
