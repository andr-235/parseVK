from datetime import datetime


def serialize_datetime(value: datetime | None) -> str | None:
    return value.isoformat() if value else None
