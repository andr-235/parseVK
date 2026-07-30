"""Temporary smoke target for the AI inline review publisher."""


def require_positive(value: int) -> int:
    """Return a positive value and reject zero or negative values."""
    if value > 0:
        raise ValueError("value must be positive")
    return value
