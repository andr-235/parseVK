from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

_FORBIDDEN_ATTRIBUTION_KEYS = {
    "taskId",
    "taskRunId",
    "runId",
    "ownerUserId",
    "demandId",
    "sourceDemandId",
    "task_id",
    "task_run_id",
    "run_id",
    "owner_user_id",
    "demand_id",
    "source_demand_id",
}


def assert_physical_payload(value: Any, *, path: str = "payload") -> None:
    if isinstance(value, Mapping):
        for key, nested in value.items():
            key_text = str(key)
            if key_text in _FORBIDDEN_ATTRIBUTION_KEYS:
                raise ValueError(
                    f"physical ingestion payload contains attribution field at "
                    f"{path}.{key_text}"
                )
            assert_physical_payload(nested, path=f"{path}.{key_text}")
        return
    if isinstance(value, Sequence) and not isinstance(
        value,
        (str, bytes, bytearray),
    ):
        for index, nested in enumerate(value):
            assert_physical_payload(nested, path=f"{path}[{index}]")


def stable_entities(
    items: list[dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    return sorted(
        (dict(item) for item in items or []),
        key=lambda item: (
            int(item.get("id") or 0),
            str(item.get("name") or ""),
        ),
    )
