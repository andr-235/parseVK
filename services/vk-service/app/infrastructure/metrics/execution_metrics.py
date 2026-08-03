"""Prometheus metrics for fenced VK execution attempts."""

from prometheus_client import Counter, Gauge

_attempt_started_total = Counter(
    "vk_execution_attempt_started_total",
    "VK execution attempts started",
)
_attempt_recovered_total = Counter(
    "vk_execution_attempt_recovered_total",
    "VK executions recovered by a newer attempt",
)
_lease_expired_total = Counter(
    "vk_execution_lease_expired_total",
    "VK execution attempts whose lease expired",
)
_fence_rejected_total = Counter(
    "vk_execution_fence_rejected_total",
    "Writes or heartbeats rejected by execution fencing",
    ["operation"],
)
_cancellation_requested_total = Counter(
    "vk_execution_cancellation_requested_total",
    "Durable VK execution cancellation requests",
)
_terminal_total = Counter(
    "vk_execution_terminal_total",
    "VK executions reaching a terminal outcome",
    ["outcome"],
)
_active_attempts = Gauge(
    "vk_execution_active_attempts",
    "Currently active VK execution attempts",
)


def observe_attempt_started(*, recovered: bool) -> None:
    _attempt_started_total.inc()
    _active_attempts.inc()
    if recovered:
        _attempt_recovered_total.inc()
        _lease_expired_total.inc()


def observe_fence_rejected(operation: str) -> None:
    _fence_rejected_total.labels(operation).inc()


def observe_cancellation_requested() -> None:
    _cancellation_requested_total.inc()


def observe_terminal(outcome: str) -> None:
    _terminal_total.labels(outcome).inc()
    _active_attempts.dec()


def observe_attempt_released() -> None:
    _active_attempts.dec()
