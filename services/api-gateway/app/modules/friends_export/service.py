from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any, Literal

from app.core.exceptions import BackendServiceError, BackendUnavailableError
from app.modules._base import translate_gateway_error
from app.modules.friends_export.adapters import FriendsExportAdapter
from app.modules.friends_export.models import (
    FriendsExportStartResponse,
    FriendsJobDetailResponse,
    SseEvent,
)
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

_XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def _serialise_sse_event(event: SseEvent) -> str:
    payload = json.dumps({"type": event.type, "data": event.data.model_dump()})
    return f"data: {payload}\n\n"


class FriendsExportService:
    def __init__(self, adapter: FriendsExportAdapter) -> None:
        self._adapter = adapter

    async def start(self, params: dict[str, Any]) -> FriendsExportStartResponse:
        try:
            return await self._adapter.start_export(params)
        except HTTPException:
            raise
        except (BackendServiceError, BackendUnavailableError) as exc:
            raise translate_gateway_error(exc) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail="Upstream error starting friends export",
            ) from exc

    async def get_job(self, job_id: str) -> FriendsJobDetailResponse:
        try:
            return await self._adapter.get_job(job_id)
        except HTTPException:
            raise
        except (BackendServiceError, BackendUnavailableError) as exc:
            raise translate_gateway_error(exc) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=502, detail="Upstream error fetching job state",
            ) from exc

    async def stream(self, job_id: str) -> StreamingResponse:
        try:
            await self.get_job(job_id)
        except HTTPException:
            raise

        async def _generate() -> AsyncIterator[str]:
            try:
                async for event in self._adapter.stream_job(job_id):
                    yield _serialise_sse_event(event)
            except Exception:
                error_payload = json.dumps(
                    {"type": "error", "data": {"message": "Stream interrupted"}},
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
        self,
        job_id: str,
        provider: Literal["vk", "ok"],
    ) -> StreamingResponse:
        try:
            data = await self._adapter.get_xlsx_bytes(job_id)
        except HTTPException:
            raise
        except (BackendServiceError, BackendUnavailableError) as exc:
            raise translate_gateway_error(exc) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=502, detail="Upstream error fetching XLSX",
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
