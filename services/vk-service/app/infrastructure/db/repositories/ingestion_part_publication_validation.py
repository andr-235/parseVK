from datetime import UTC, datetime


def require_aware(value: datetime, label: str) -> None:
    if value.tzinfo is None:
        raise ValueError(f"{label} must be timezone-aware")


def require_future(value: datetime, label: str) -> None:
    require_aware(value, label)
    if value <= datetime.now(UTC):
        raise ValueError(f"{label} must be in the future")


def normalized_reason(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError("publication failure reason must not be empty")
    return normalized[:2000]


def require_sha256(value: str) -> None:
    if len(value) != 64:
        raise ValueError("wire_digest must be a SHA-256 hex digest")
    try:
        int(value, 16)
    except ValueError as error:
        raise ValueError("wire_digest must be a SHA-256 hex digest") from error
