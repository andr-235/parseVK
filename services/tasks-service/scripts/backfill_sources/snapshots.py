import json
from typing import Any

from app.db.models import MonitoringSource, Task


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def snapshot_sha256(value: Any) -> str:
    from common.security import stable_sha256

    return stable_sha256(canonical_json(value))


def build_source_set_snapshot(
    task: Task,
    sources: list[MonitoringSource],
) -> list[dict]:
    selected = sorted(
        sources,
        key=lambda source: (
            source.provider,
            source.source_type,
            source.external_id,
            str(source.id),
        ),
    )
    return [
        {
            "sourceId": str(source.id),
            "provider": source.provider,
            "sourceType": source.source_type,
            "externalId": source.external_id,
            "ownerId": source.owner_id,
            "sourceRevision": source.revision,
            "taskRevision": task.revision,
        }
        for source in selected
    ]


def build_run_snapshot(task: Task, source_set_snapshot: list[dict]) -> tuple[dict, str]:
    """Build a concrete run snapshot without legacy ``group_ids`` selectors."""
    config_snapshot = {
        "scope": task.scope,
        "mode": task.mode,
        "postLimit": task.post_limit,
    }
    payload = {
        "config": config_snapshot,
        "sourceSet": source_set_snapshot,
        "sourceSetRevision": task.source_set_revision,
    }
    return config_snapshot, snapshot_sha256(payload)
