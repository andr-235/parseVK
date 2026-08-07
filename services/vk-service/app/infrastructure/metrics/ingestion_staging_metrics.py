from prometheus_client import Counter

_staging_results_total = Counter(
    "vk_ingestion_staging_results_total",
    "Durable ingestion staging outcomes by physical source kind",
    ["source_kind", "result"],
)


def observe_staging_result(source_kind: str, result: str) -> None:
    _staging_results_total.labels(source_kind, result).inc()
