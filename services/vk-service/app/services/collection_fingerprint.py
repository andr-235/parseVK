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


def _fingerprint(normalized_plan: dict[str, Any]) -> str:
    serialized = json.dumps(
        normalized_plan,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(serialized).hexdigest()


def build_source_collection_identity(
    *,
    provider_account_key: str,
    source_provider: str,
    source_type: str,
    source_external_id: str,
    source_owner_id: int,
    post_strategy: str,
    post_limit: int,
    comment_mode: str,
    include_thread_replies: bool,
) -> CollectionIdentity:
    """Build identity from the physical source and collection plan only.

    TaskRun, demand, revision and snapshot metadata are deliberately excluded.
    They describe who requested the work, not the physical VK work itself.
    """

    source_key = f"{source_provider}:{source_type}:{source_external_id}"
    normalized_plan: dict[str, Any] = {
        "identityVersion": 2,
        "providerAccountKey": provider_account_key,
        "source": {
            "provider": source_provider,
            "sourceType": source_type,
            "externalId": str(source_external_id),
            "ownerId": int(source_owner_id),
        },
        "postSelection": {
            "strategy": post_strategy,
            "limitPerSource": int(post_limit),
        },
        "commentSelection": {
            "mode": comment_mode,
            "includeThreadReplies": bool(include_thread_replies),
        },
    }
    return CollectionIdentity(
        provider_account_key=provider_account_key,
        source_key=source_key,
        fingerprint=_fingerprint(normalized_plan),
        normalized_plan=normalized_plan,
    )


def build_collection_identity(
    *,
    provider_account_key: str,
    scope: str,
    mode: str,
    group_ids: list[int],
    post_limit: int | None,
    payload: dict[str, Any] | None = None,
) -> CollectionIdentity:
    """Build the legacy aggregate identity used by task-event compatibility."""

    normalized_groups = sorted({int(group_id) for group_id in group_ids})
    source_key = (
        "vk:groups:" + ",".join(str(group_id) for group_id in normalized_groups)
        if normalized_groups
        else f"vk:scope:{scope}"
    )
    normalized_plan = {
        "identityVersion": 1,
        "providerAccountKey": provider_account_key,
        "sourceKey": source_key,
        "scope": scope,
        "mode": mode,
        "groupIds": normalized_groups,
        "postLimit": post_limit,
        "filters": _normalize_filters(payload or {}),
    }
    return CollectionIdentity(
        provider_account_key=provider_account_key,
        source_key=source_key,
        fingerprint=_fingerprint(normalized_plan),
        normalized_plan=normalized_plan,
    )


def _normalize_filters(payload: dict[str, Any]) -> dict[str, Any]:
    ignored = {
        "taskId",
        "task_id",
        "taskRunId",
        "task_run_id",
        "runId",
        "run_id",
        "executionId",
        "execution_id",
        "demandId",
        "demand_id",
        "sourceId",
        "source_id",
        "ownerUserId",
        "owner_user_id",
        "taskRevision",
        "task_revision",
        "sourceSetRevision",
        "source_set_revision",
        "snapshotSha256",
        "snapshot_sha256",
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
