"""SSE proxy endpoint for realtime event stream."""

from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.security import require_auth
from app.core.utils import request_ids

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/realtime", tags=["realtime"])


@router.get("/stream")
async def realtime_stream(
    request: Request,
    auth_claims: dict = Depends(require_auth),
    last_event_id: str | None = Header(default=None, alias="Last-Event-ID"),
):
    """SSE proxy: forwards to realtime-service internal endpoint.

    Requires JWT authentication. Forwards browser's Last-Event-ID header
    as lastEventId query parameter to the realtime-service.
    """
    user_id = str(auth_claims.get("sub", ""))
    roles = auth_claims.get("roles", "")
    request_id, correlation_id = request_ids(request)

    # Build upstream URL
    upstream_base = settings.realtime_base_url.rstrip("/")
    upstream_path = "/internal/realtime/stream"

    # Build query params
    params = {
        "audienceType": "authenticated",
        "audienceId": user_id,
    }

    # Forward Last-Event-ID from browser as lastEventId query param
    if last_event_id:
        params["lastEventId"] = last_event_id
        logger.debug("Forwarding Last-Event-ID=%s", last_event_id)

    headers = {
        "X-Internal-Service-Token": settings.internal_service_token,
        "X-User-ID": user_id,
        "X-User-Roles": str(roles),
        "X-Correlation-ID": correlation_id or "",
        "X-Request-ID": request_id or "",
    }

    logger.info(
        "Realtime stream client=%s connected, lastEventId=%s",
        user_id, last_event_id,
    )

    async def event_stream():
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(connect=10.0, read=None)) as client:
                async with client.stream(
                    "GET",
                    f"{upstream_base}{upstream_path}",
                    params=params,
                    headers=headers,
                ) as response:
                    if response.status_code != 200:
                        logger.error(
                            "Upstream returned %d for user=%s",
                            response.status_code, user_id,
                        )
                        yield f"event: error\ndata: {{\"type\": \"upstream_error\", \"status\": {response.status_code} }}\n\n"
                        return

                    async for chunk in response.aiter_bytes():
                        yield chunk
        except httpx.ConnectError as exc:
            logger.error("Failed to connect to realtime-service: %s", exc)
            yield "event: error\ndata: {\"type\": \"connection_error\", \"message\": \"upstream unavailable\"}\n\n"
        except Exception as exc:
            logger.exception("Realtime stream error for user=%s: %s", user_id, exc)
            yield f"event: error\ndata: {{\"type\": \"stream_error\", \"message\": \"{exc}\"}}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
