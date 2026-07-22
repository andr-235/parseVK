from prometheus_client import Histogram

search_duration = Histogram(
    "content_search_duration_seconds",
    "Search duration by mode (simple/keyword)",
    ["mode"],
)

search_rows_scanned = Histogram(
    "content_search_rows_scanned",
    "Rows scanned per keyword search request",
    ["mode"],
)
