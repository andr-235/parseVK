"""Prometheus metrics for VK provider accounts, scheduler and transport.

Import-safe: only module-level metric registration, no side effects. All VK
API traffic flows through the fair scheduler, so its hooks observe transport
calls as well; account lifecycle transitions update gauges from the executor
guard and the startup reconciliation paths.
"""

import logging
from datetime import UTC, datetime

from prometheus_client import Counter, Gauge, Histogram, Info

logger = logging.getLogger(__name__)

OUTCOME_SUCCESS = "success"
OUTCOME_AUTH = "auth"
OUTCOME_RATE_LIMIT = "rate_limit"
OUTCOME_INFRA = "infra"
OUTCOME_DOMAIN = "domain"

_DURATION_BUCKETS = (0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, float("inf"))
_WAIT_BUCKETS = (0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, float("inf"))

_requests_total = Counter(
    "vk_requests_total",
    "VK API requests by account, method and outcome",
    ["account_id", "method", "outcome"],
)
_request_duration_seconds = Histogram(
    "vk_request_duration_seconds",
    "VK API request duration by account and method",
    ["account_id", "method"],
    buckets=_DURATION_BUCKETS,
)
_rate_limit_retries_total = Counter(
    "vk_rate_limit_retries_total",
    "Rate-limit retries by account and VK error code",
    ["account_id", "code"],
)
_scheduler_queue_depth = Gauge(
    "vk_scheduler_queue_depth",
    "Pending scheduler requests by account",
    ["account_id"],
)
_scheduler_wait_seconds = Histogram(
    "vk_scheduler_wait_seconds",
    "Request wait time in the scheduler queue by account",
    ["account_id"],
    buckets=_WAIT_BUCKETS,
)
_account_status = Gauge(
    "vk_account_status",
    "Provider account status (1 on the current status, 0 on the others)",
    ["account_id", "status"],
)
_account_cooldown_seconds = Gauge(
    "vk_account_cooldown_seconds",
    "Seconds until provider account cooldown ends (0 = none)",
    ["account_id"],
)
_provider_account_info = Info(
    "vk_provider_account_info",
    "Provider account credential version",
    ["account_id"],
)

_last_status: dict[str, str] = {}


def observe_request(account_id: str, method: str, outcome: str, duration_seconds: float) -> None:
    _requests_total.labels(account_id, method, outcome).inc()
    _request_duration_seconds.labels(account_id, method).observe(duration_seconds)


def observe_scheduler_wait(account_id: str, wait_seconds: float) -> None:
    _scheduler_wait_seconds.labels(account_id).observe(wait_seconds)


def observe_rate_limit_retry(account_id: str, code: int) -> None:
    _rate_limit_retries_total.labels(account_id, str(code)).inc()


def set_scheduler_queue_depth(account_id: str, depth: int) -> None:
    _scheduler_queue_depth.labels(account_id).set(depth)


def set_account_status(account_id: str, status: str) -> None:
    previous = _last_status.get(account_id)
    if previous is not None and previous != status:
        _account_status.labels(account_id, previous).set(0)
    _last_status[account_id] = status
    _account_status.labels(account_id, status).set(1)


def set_account_cooldown(account_id: str, seconds: float) -> None:
    _account_cooldown_seconds.labels(account_id).set(max(0.0, seconds))


def set_provider_account_info(account_id: str, credential_version: str) -> None:
    _provider_account_info.labels(account_id).info({"credential_version": credential_version})


def cooldown_seconds_until(until: datetime | None, current: datetime | None = None) -> float:
    if until is None:
        return 0.0
    now = datetime.now(UTC) if current is None else current
    return max(0.0, (until - now).total_seconds())
