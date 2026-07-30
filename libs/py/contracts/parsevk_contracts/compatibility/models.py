from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class CompatibilityViolation:
    """A single compatibility violation between baseline and current contracts."""

    code: str
    message_type: str
    schema_version: int
    field: str | None
    detail: str


class CompatibilityCheckError(Exception):
    """Operational error — the check itself could not complete (exit code 2)."""