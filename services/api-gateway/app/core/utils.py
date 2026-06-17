from common.headers import CORRELATION_ID_HEADER, REQUEST_ID_HEADER
from fastapi import Request


def request_ids(request: Request) -> tuple[str | None, str | None]:
    return request.headers.get(REQUEST_ID_HEADER), request.headers.get(CORRELATION_ID_HEADER)
