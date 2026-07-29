#!/usr/bin/env python3
"""Run review.py with stable Zen HTTP headers and useful error details."""

from __future__ import annotations

import runpy
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
USER_AGENT = "parseVK-ai-reviewer/1.0"

_original_request = urllib.request.Request
_original_urlopen = urllib.request.urlopen


class RequestWithUserAgent(_original_request):
    """Add a browser-independent User-Agent unless the caller already set one."""

    def __init__(
        self,
        url: str,
        data: bytes | None = None,
        headers: dict[str, str] | None = None,
        origin_req_host: str | None = None,
        unverifiable: bool = False,
        method: str | None = None,
    ) -> None:
        effective_headers = dict(headers or {})
        effective_headers.setdefault("User-Agent", USER_AGENT)
        super().__init__(
            url,
            data=data,
            headers=effective_headers,
            origin_req_host=origin_req_host,
            unverifiable=unverifiable,
            method=method,
        )


def urlopen_with_zen_details(
    url: str | urllib.request.Request,
    data: bytes | None = None,
    timeout: float | object = urllib.request._GLOBAL_DEFAULT_TIMEOUT,
    *args: Any,
    **kwargs: Any,
):
    """Preserve Zen's response body in the exception without exposing secrets."""

    try:
        return _original_urlopen(url, data=data, timeout=timeout, *args, **kwargs)
    except urllib.error.HTTPError as exc:
        request_url = url.full_url if isinstance(url, urllib.request.Request) else str(url)
        if "opencode.ai/zen/" not in request_url:
            raise
        body = exc.read().decode(errors="replace")[:3000]
        raise urllib.error.URLError(f"Zen API HTTP {exc.code}: {body}") from exc


urllib.request.Request = RequestWithUserAgent
urllib.request.urlopen = urlopen_with_zen_details

runpy.run_path(str(HERE / "review.py"), run_name="__main__")
