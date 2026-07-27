"""Prometheus metrics for outbox publisher."""

from __future__ import annotations

from prometheus_client import REGISTRY, Counter, Gauge


def create_outbox_metrics(namespace: str = "outbox"):
    """Create and return outbox metric collectors."""
    pending_name = f"{namespace}_pending_total"
    oldest_name = f"{namespace}_oldest_age_seconds"
    failures_name = f"{namespace}_publish_failures_total"

    try:
        pending_gauge = Gauge(
            pending_name,
            "Number of pending outbox events",
            ["namespace"],
        )
        oldest_gauge = Gauge(
            oldest_name,
            "Age of the oldest pending outbox event in seconds",
            ["namespace"],
        )
        publish_failures = Counter(
            failures_name,
            "Total outbox publish failures",
            ["namespace", "event_type"],
        )
    except ValueError:
        # Collectors already registered in this process (common in tests).
        pending_gauge = REGISTRY._names_to_collectors[pending_name]  # type: ignore[assignment]
        oldest_gauge = REGISTRY._names_to_collectors[oldest_name]  # type: ignore[assignment]
        publish_failures = REGISTRY._names_to_collectors[failures_name]  # type: ignore[assignment]

    class OutboxMetrics:
        def set_pending(self, count: int) -> None:
            pending_gauge.labels(namespace=namespace).set(count)

        def set_oldest_age(self, seconds: float) -> None:
            oldest_gauge.labels(namespace=namespace).set(seconds)

        def inc_publish_failure(self, event_type: str) -> None:
            publish_failures.labels(namespace=namespace, event_type=event_type).inc()

    return OutboxMetrics()
