from prometheus_client import Counter, Histogram

search_requests = Counter(
    "gateway_search_requests_total",
    "Search requests by backend, method and outcome",
    ["backend", "method", "outcome"],
)

search_duration = Histogram(
    "gateway_search_duration_seconds",
    "Search duration by backend and method",
    ["backend", "method"],
)
