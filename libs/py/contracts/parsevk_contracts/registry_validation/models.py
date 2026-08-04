from __future__ import annotations

from dataclasses import dataclass

SUPPORTED_CAUSATION_POLICIES = frozenset({"optional", "required", "forbidden"})


@dataclass(frozen=True, slots=True)
class RegistryViolation:
    code: str
    message_type: str
    field: str
    detail: str
