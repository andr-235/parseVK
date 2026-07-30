from __future__ import annotations

from dataclasses import dataclass

SUPPORTED_CAUSATION_POLICIES = frozenset({"optional", "required", "forbidden"})
SUPPORTED_COMPATIBILITY = frozenset({"backward"})


@dataclass(frozen=True, slots=True)
class RegistryViolation:
    """A single metadata completeness violation in the contract registry."""

    code: str
    message_type: str
    schema_version: int | None
    field: str
    detail: str