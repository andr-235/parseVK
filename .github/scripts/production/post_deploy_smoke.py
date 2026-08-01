#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_ENDPOINTS = (
    "frontend=http://127.0.0.1:8080/",
    "api-gateway=http://127.0.0.1:3002/health",
)


def parse_endpoint(value: str) -> tuple[str, str]:
    name, separator, url = value.partition("=")
    if not separator or not name or not url:
        raise argparse.ArgumentTypeError("endpoint must use NAME=URL")
    return name, url


def check_endpoint(name: str, url: str, attempts: int, timeout: float, delay: float) -> dict[str, object]:
    result: dict[str, object] = {
        "name": name,
        "url": url,
        "success": False,
        "status": None,
        "attempts": 0,
        "latency_ms": None,
        "error": None,
    }
    for attempt in range(1, attempts + 1):
        started = time.monotonic()
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "parseVK-production-smoke/1"})
            with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310
                status = int(response.status)
            result.update(
                status=status,
                attempts=attempt,
                latency_ms=round((time.monotonic() - started) * 1000),
                success=200 <= status < 400,
                error=None,
            )
        except urllib.error.HTTPError as error:
            result.update(
                status=int(error.code),
                attempts=attempt,
                latency_ms=round((time.monotonic() - started) * 1000),
                error=str(error),
            )
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            result.update(
                attempts=attempt,
                latency_ms=round((time.monotonic() - started) * 1000),
                error=str(error),
            )
        if result["success"]:
            return result
        if attempt < attempts:
            time.sleep(delay)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Read-only production HTTP smoke checks")
    parser.add_argument("--endpoint", action="append", type=parse_endpoint)
    parser.add_argument("--attempts", type=int, default=5)
    parser.add_argument("--timeout", type=float, default=5.0)
    parser.add_argument("--delay", type=float, default=2.0)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()

    if args.attempts < 1 or args.timeout <= 0 or args.delay < 0:
        parser.error("attempts/timeout/delay values are invalid")

    endpoints = args.endpoint or [parse_endpoint(item) for item in DEFAULT_ENDPOINTS]
    checks = [
        check_endpoint(name, url, args.attempts, args.timeout, args.delay)
        for name, url in endpoints
    ]
    report = {
        "schema_version": 1,
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "success": all(bool(check["success"]) for check in checks),
        "checks": checks,
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(report, sort_keys=True))
    return 0 if report["success"] else 1


if __name__ == "__main__":
    sys.exit(main())
