import hashlib
import json
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class CollectionIdentity:
    provider_account_key: str
    source_key: str
    fingerprint: str
    normalized_plan: dict[str, Any]


def build_collection_identity(
    *,
    provider_account_key: str,
    scope: str,
    mode: str,
    group_ids: list[int],
    post_limit: int | None,
    payload: dict[str, Any] | None = None,
) -> CollectionIdentity:
    normalized_groups = sorted({int(group_id) for group_id in group_ids})
    source_key = (
        "vk:groups:" + ",".join(str(group_id) for group_id in normalized_groups)
        if normalized_groups
        else f"vk:scope:{scope}"
    )
    normalized_plan = {
        "providerAccountKey": provider_account_key,
        "sourceKey": source_key,
        "scope": scope,
        "mode": mode,
        "groupIds": normalized_groups,
        "postLimit": post_limit,
        "filters": _normalize_filters(payload or {}),
    }
    serialized = json.dumps(
        normalized_plan,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return CollectionIdentity(
        provider_account_key=provider_account_key,
        source_key=source_key,
        fingerprint=hashlib.sha256(serialized).hexdigest(),
        normalized_plan=normalized_plan,
    )


def _normalize_filters(payload: dict[str, Any]) -> dict[str, Any]:
    ignored = {
        "taskId",
        "task_id",
        "runId",
        "run_id",
        "ownerUserId",
        "owner_user_id",
        "createdAt",
        "created_at",
        "updatedAt",
        "updated_at",
        "correlationId",
        "correlation_id",
        "requestId",
        "request_id",
        "source",
    }
    plan_fields = {
        "scope",
        "mode",
        "groupIds",
        "group_ids",
        "postLimit",
        "post_limit",
    }
    return {
        key: _normalize_value(value)
        for key, value in sorted(payload.items())
        if key not in ignored and key not in plan_fields
    }


def _normalize_value(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _normalize_value(value[key]) for key in sorted(value)}
    if isinstance(value, (list, tuple, set)):
        normalized = [_normalize_value(item) for item in value]
        try:
            return sorted(normalized, key=lambda item: json.dumps(item, sort_keys=True))
        except TypeError:
            return normalized
    return value
