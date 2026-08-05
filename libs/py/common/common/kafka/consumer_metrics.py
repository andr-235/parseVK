"""Lag metric updates for Kafka consumers."""


def update_lag_metric(lag_gauge, consumer_group: str, message) -> None:
    if lag_gauge is None:
        return
    try:
        lag = (
            message.highwater_mark - message.offset - 1
            if message.highwater_mark is not None
            else 0
        )
        lag_gauge.labels(
            topic=message.topic,
            consumer_group=consumer_group,
            partition=str(message.partition),
        ).set(max(lag, 0))
    except Exception:
        pass
