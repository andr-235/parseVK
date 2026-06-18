"""
Unit tests for FriendsExportService.

These tests exercise the common lifecycle coordinator without any real
provider adapters, VK/OK API calls, or network I/O.  Each adapter
method is replaced by an AsyncMock so we can test:

  - Delegation: service routes calls to the adapter.
  - Error shaping: non-HTTP adapter exceptions become HTTP 502.
  - HTTPException passthrough: 404/400 from adapter are re-raised as-is.
  - SSE serialisation: events are formatted as `data: <json>\n\n`.
  - Download headers: Content-Disposition and Content-Type are correct.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.friends_export.models import (
    DoneEventData,
    FriendsExportStartResponse,
    FriendsJobDetailResponse,
    FriendsJobLogEntry,
    FriendsJobState,
    JobStatus,
    LogEventData,
    ProgressEventData,
    SseDoneEvent,
    SseLogEvent,
    SseProgressEvent,
)
from app.modules.friends_export.service import FriendsExportService
from fastapi import HTTPException

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_adapter(**overrides) -> MagicMock:
    """Build a mock adapter with sane defaults for all methods."""
    adapter = MagicMock()
    adapter.start_export = AsyncMock(
        return_value=FriendsExportStartResponse(
            jobId="job-uuid-1", status=JobStatus.RUNNING
        )
    )
    adapter.get_job = AsyncMock(
        return_value=FriendsJobDetailResponse(
            job=FriendsJobState(
                id="job-uuid-1",
                status=JobStatus.DONE,
                fetchedCount=100,
                totalCount=100,
                createdAt="2026-05-24T00:00:00Z",
            ),
            logs=[
                FriendsJobLogEntry(
                    id="log-1",
                    level="info",
                    message="Export complete",
                    createdAt="2026-05-24T00:01:00Z",
                )
            ],
        )
    )
    adapter.get_xlsx_bytes = AsyncMock(return_value=b"PK\x03\x04fake-xlsx-bytes")

    async def _stream_stub(job_id: str):
        yield SseProgressEvent(
            data=ProgressEventData(fetchedCount=50, totalCount=100, limitApplied=False)
        )
        yield SseDoneEvent(
            data=DoneEventData(jobId=job_id, fetchedCount=100, totalCount=100)
        )

    adapter.stream_job = _stream_stub

    for key, value in overrides.items():
        setattr(adapter, key, value)
    return adapter


# ---------------------------------------------------------------------------
# start()
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_start_delegates_to_adapter():
    adapter = _make_adapter()
    service = FriendsExportService(adapter)

    result = await service.start({"user_id": 12345})

    adapter.start_export.assert_awaited_once_with({"user_id": 12345})
    assert result.jobId == "job-uuid-1"
    assert result.status == JobStatus.RUNNING


@pytest.mark.asyncio
async def test_start_reraises_http_400():
    adapter = _make_adapter(
        start_export=AsyncMock(
            side_effect=HTTPException(status_code=400, detail="Missing params")
        )
    )
    service = FriendsExportService(adapter)

    with pytest.raises(HTTPException) as exc_info:
        await service.start({})

    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_start_wraps_unexpected_error_as_502():
    adapter = _make_adapter(
        start_export=AsyncMock(side_effect=RuntimeError("db connection lost"))
    )
    service = FriendsExportService(adapter)

    with pytest.raises(HTTPException) as exc_info:
        await service.start({"user_id": 1})

    assert exc_info.value.status_code == 502
    # Raw internal error message must not leak to the client
    assert "db connection lost" not in exc_info.value.detail


# ---------------------------------------------------------------------------
# get_job()
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_job_returns_adapter_result():
    adapter = _make_adapter()
    service = FriendsExportService(adapter)

    result = await service.get_job("job-uuid-1")

    adapter.get_job.assert_awaited_once_with("job-uuid-1")
    assert result.job.id == "job-uuid-1"
    assert result.job.status == JobStatus.DONE
    assert len(result.logs) == 1


@pytest.mark.asyncio
async def test_get_job_reraises_http_404():
    adapter = _make_adapter(
        get_job=AsyncMock(
            side_effect=HTTPException(status_code=404, detail="Not found")
        )
    )
    service = FriendsExportService(adapter)

    with pytest.raises(HTTPException) as exc_info:
        await service.get_job("missing-job")

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_job_wraps_unexpected_error_as_502():
    adapter = _make_adapter(
        get_job=AsyncMock(side_effect=RuntimeError("connection reset"))
    )
    service = FriendsExportService(adapter)

    with pytest.raises(HTTPException) as exc_info:
        await service.get_job("job-uuid-1")

    assert exc_info.value.status_code == 502
    assert "Upstream error" in exc_info.value.detail


# ---------------------------------------------------------------------------
# stream()
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_stream_returns_404_before_opening_sse_when_job_missing():
    """
    Pre-validation must raise HTTPException(404) as a proper HTTP response,
    not inside a broken SSE body.
    """
    adapter = _make_adapter(
        get_job=AsyncMock(
            side_effect=HTTPException(status_code=404, detail="Job not found")
        )
    )
    service = FriendsExportService(adapter)

    with pytest.raises(HTTPException) as exc_info:
        await service.stream("missing-job")

    assert exc_info.value.status_code == 404
    # get_job called once (pre-validation); stream_job must NOT be called
    adapter.get_job.assert_awaited_once_with("missing-job")


@pytest.mark.asyncio
async def test_stream_produces_sse_formatted_events():
    adapter = _make_adapter()
    service = FriendsExportService(adapter)

    response = await service.stream("job-uuid-1")

    # Collect all chunks from the StreamingResponse body iterator
    chunks: list[str] = []
    async for chunk in response.body_iterator:
        chunks.append(chunk)

    assert len(chunks) == 2  # progress + done

    # First chunk: progress event
    assert chunks[0].startswith("data: ")
    assert chunks[0].endswith("\n\n")
    progress_payload = json.loads(chunks[0][len("data: ") :].strip())
    assert progress_payload["type"] == "progress"
    assert progress_payload["data"]["fetchedCount"] == 50
    assert progress_payload["data"]["totalCount"] == 100
    assert progress_payload["data"]["limitApplied"] is False

    # Second chunk: done event
    done_payload = json.loads(chunks[1][len("data: ") :].strip())
    assert done_payload["type"] == "done"
    assert done_payload["data"]["jobId"] == "job-uuid-1"
    assert done_payload["data"]["status"] == "DONE"


@pytest.mark.asyncio
async def test_stream_emits_safe_error_event_on_adapter_exception():
    """Unexpected adapter errors must NOT leak internals to the client."""

    async def _failing_stream(job_id: str):
        yield SseProgressEvent(
            data=ProgressEventData(fetchedCount=0, totalCount=0, limitApplied=False)
        )
        raise RuntimeError("internal db crash")

    adapter = _make_adapter()
    adapter.stream_job = _failing_stream
    service = FriendsExportService(adapter)

    response = await service.stream("job-uuid-1")

    chunks: list[str] = []
    async for chunk in response.body_iterator:
        chunks.append(chunk)

    # Must emit exactly 2 events: the progress one + the injected safe error
    assert len(chunks) == 2
    error_payload = json.loads(chunks[-1][len("data: ") :].strip())
    assert error_payload["type"] == "error"
    assert "internal db crash" not in error_payload["data"]["message"]
    assert error_payload["data"]["message"] == "Stream interrupted"


@pytest.mark.asyncio
async def test_stream_log_event_shape():
    async def _log_stream(job_id: str):
        yield SseLogEvent(data=LogEventData(level="info", message="Fetching page 1"))

    adapter = _make_adapter()
    adapter.stream_job = _log_stream
    service = FriendsExportService(adapter)

    response = await service.stream("job-uuid-1")
    chunks = [chunk async for chunk in response.body_iterator]

    assert len(chunks) == 1
    payload = json.loads(chunks[0][len("data: ") :].strip())
    assert payload["type"] == "log"
    assert payload["data"]["level"] == "info"
    assert payload["data"]["message"] == "Fetching page 1"


# ---------------------------------------------------------------------------
# download_xlsx()
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_download_xlsx_sets_correct_headers():
    adapter = _make_adapter()
    service = FriendsExportService(adapter)

    response = await service.download_xlsx("job-uuid-1", "vk")

    adapter.get_xlsx_bytes.assert_awaited_once_with("job-uuid-1")
    assert response.media_type == (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert response.headers["content-disposition"] == (
        'attachment; filename="vk_friends_export_job-uuid-1.xlsx"'
    )
    assert response.headers["content-length"] == str(len(b"PK\x03\x04fake-xlsx-bytes"))


@pytest.mark.asyncio
async def test_download_xlsx_ok_provider_filename():
    adapter = _make_adapter()
    service = FriendsExportService(adapter)

    response = await service.download_xlsx("job-uuid-2", "ok")

    assert (
        "ok_friends_export_job-uuid-2.xlsx" in response.headers["content-disposition"]
    )


@pytest.mark.asyncio
async def test_download_xlsx_reraises_http_404():
    adapter = _make_adapter(
        get_xlsx_bytes=AsyncMock(
            side_effect=HTTPException(status_code=404, detail="File not found")
        )
    )
    service = FriendsExportService(adapter)

    with pytest.raises(HTTPException) as exc_info:
        await service.download_xlsx("job-uuid-1", "vk")

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_download_xlsx_wraps_unexpected_error_as_502():
    adapter = _make_adapter(
        get_xlsx_bytes=AsyncMock(side_effect=ConnectionError("storage down"))
    )
    service = FriendsExportService(adapter)

    with pytest.raises(HTTPException) as exc_info:
        await service.download_xlsx("job-uuid-1", "vk")

    assert exc_info.value.status_code == 502
    assert "storage down" not in exc_info.value.detail


# ---------------------------------------------------------------------------
# Adapter Protocol compliance
# ---------------------------------------------------------------------------


def test_adapter_satisfies_protocol():
    """Verify the mock structurally satisfies FriendsExportAdapter."""
    from app.modules.friends_export.adapters import FriendsExportAdapter

    adapter = _make_adapter()
    # runtime_checkable Protocol check (structural)
    assert isinstance(adapter, FriendsExportAdapter)
