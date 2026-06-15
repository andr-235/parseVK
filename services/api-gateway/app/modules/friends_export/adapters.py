"""
Adapter Protocol for friends export providers.

VK and OK adapters implement this Protocol.  The common
FriendsExportService depends only on this interface, keeping
provider-specific I/O (API calls, signature logic, XLSX generation)
entirely inside each adapter.

Adapter contract:
  - start_export  → start a new export job; return { jobId, status }
  - get_job       → fetch current job state + logs
  - stream_job    → yield SSE events for the job lifecycle
  - get_xlsx_bytes → return raw XLSX bytes for download

Security requirement (applies to all adapters):
  - MUST NOT log access_token, session_key, sig, or any credential.
  - MUST NOT surface raw provider error bodies in SSE 'error' events.

Ref: FASTAPI-MIG-010B / docs/FASTAPI_MIG_010_FRIENDS_EXPORT_INVENTORY.md
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any, Protocol, runtime_checkable

from app.modules.friends_export.models import (
    FriendsExportStartResponse,
    FriendsJobDetailResponse,
    SseEvent,
)


@runtime_checkable
class FriendsExportAdapter(Protocol):
    """
    Provider adapter for the friends export lifecycle.

    Responsibilities:
      - External API I/O (VK / OK API calls).
      - Normalising raw provider data into the shared contract types.

    NOT responsible for:
      - Job routing, SSE serialisation, HTTP response building.
      - Those concerns live in FriendsExportService.
    """

    async def start_export(
        self, params: dict[str, Any]
    ) -> FriendsExportStartResponse:
        """
        Start a new export job.

        VK params shape:  { "user_id": int }
        OK params shape:  { "fid": str, "offset": int, "limit": int }

        Returns FriendsExportStartResponse with jobId and initial status.
        Raises HTTPException(400) for invalid params.
        """
        ...

    async def get_job(self, job_id: str) -> FriendsJobDetailResponse:
        """
        Fetch the current state of an export job.

        Returns FriendsJobDetailResponse (job snapshot + log entries).
        Raises HTTPException(404) if the job does not exist.
        Raises HTTPException(400) if job_id is not a valid UUID v4.
        """
        ...

    async def stream_job(self, job_id: str) -> AsyncIterator[SseEvent]:
        """
        Yield SSE events for the job lifecycle.

        Behaviour:
          - If job is already DONE/FAILED, yield a single terminal event and stop.
          - Otherwise yield progress/log events as they arrive, then the
            terminal done/error event.

        Yields SseEvent instances (SseProgressEvent | SseLogEvent |
        SseDoneEvent | SseErrorEvent).
        """
        ...

    async def get_xlsx_bytes(self, job_id: str) -> bytes:
        """
        Return the raw XLSX binary for a completed job.

        Raises HTTPException(404) if file or job does not exist.
        """
        ...
