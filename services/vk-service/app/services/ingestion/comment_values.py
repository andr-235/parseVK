from datetime import UTC, datetime


def comment_date(comment: dict) -> datetime | None:
    value = comment.get("date")
    if value is None:
        return None
    return datetime.fromtimestamp(int(value), tz=UTC)
