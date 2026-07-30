from typing import cast

from prometheus_client import REGISTRY, Counter, Histogram


def _counter(name: str, documentation: str, labels: list[str]) -> Counter:
    existing = REGISTRY._names_to_collectors.get(name)
    if existing is not None:
        return cast(Counter, existing)
    return Counter(name, documentation, labels)


def _histogram(name: str, documentation: str, labels: list[str]) -> Histogram:
    existing = REGISTRY._names_to_collectors.get(name)
    if existing is not None:
        return cast(Histogram, existing)
    return Histogram(name, documentation, labels)


search_requests = _counter(
    "gateway_search_requests",
    "Search requests by backend, method and outcome",
    ["backend", "method", "outcome"],
)

search_duration = _histogram(
    "gateway_search_duration_seconds",
    "Search duration by backend and method",
    ["backend", "method"],
)
