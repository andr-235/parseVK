import logging
from time import perf_counter
from uuid import uuid4

from fastapi import Request

logger = logging.getLogger(__name__)
CORRELATION_HEADER = "X-Correlation-ID"
REQUEST_HEADER = "X-Request-ID"


async def log_request(request: Request, call_next):
    correlation_id = request.headers.get(CORRELATION_HEADER) or str(uuid4())
    request_id = request.headers.get(REQUEST_HEADER) or correlation_id
    operation = f"{request.method} {request.url.path}"
    started = perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        duration_ms = (perf_counter() - started) * 1000
        logger.exception(
            "HTTP request failed: operation=%s request_id=%s "
            "correlation_id=%s duration_ms=%.2f",
            operation,
            request_id,
            correlation_id,
            duration_ms,
        )
        raise
    duration_ms = (perf_counter() - started) * 1000
    response.headers[CORRELATION_HEADER] = correlation_id
    response.headers[REQUEST_HEADER] = request_id
    logger.info(
        "HTTP request completed: operation=%s request_id=%s "
        "correlation_id=%s status=%s duration_ms=%.2f",
        operation,
        request_id,
        correlation_id,
        response.status_code,
        duration_ms,
    )
    return response
