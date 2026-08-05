"""Deterministic repair of historical TaskRun snapshots before hard constraints."""

from __future__ import annotations

import hashlib
import json
import re
from typing import Any

import sqlalchemy as sa
from sqlalchemy.engine import Connection

SHA256 = re.compile(r"^[0-9a-f]{64}$")


def repair_task_run_snapshots(connection: Connection) -> int:
    repaired = 0
    rows = connection.execute(
        sa.text(
            """
            SELECT
                run.id,
                run.task_id,
                run.source_set_revision,
                run.snapshot_sha256,
                run.config_snapshot,
                run.source_set_snapshot,
                task.scope,
                task.mode,
                task.post_limit,
                task.revision AS task_revision
            FROM task_runs AS run
            JOIN tasks AS task ON task.id = run.task_id
            ORDER BY run.created_at, run.id
            """
        )
    ).mappings()
    for row in rows:
        config = _normalized_config(row)
        source_set = _normalized_source_set(connection, row)
        expected_hash = _snapshot_hash(
            config,
            source_set,
            int(row["source_set_revision"]),
        )
        existing_hash = str(row["snapshot_sha256"] or "")
        source_changed = source_set != row["source_set_snapshot"]
        config_changed = config != row["config_snapshot"]
        if (
            existing_hash
            and SHA256.fullmatch(existing_hash)
            and not source_changed
            and not config_changed
            and existing_hash != expected_hash
        ):
            raise RuntimeError(
                "TaskRun snapshot hash mismatch for "
                f"{row['id']}: stored={existing_hash} expected={expected_hash}"
            )
        final_hash = expected_hash if (
            source_changed
            or config_changed
            or not SHA256.fullmatch(existing_hash)
        ) else existing_hash
        if source_changed or config_changed or final_hash != existing_hash:
            connection.execute(
                sa.text(
                    """
                    UPDATE task_runs
                    SET config_snapshot = CAST(:config AS jsonb),
                        source_set_snapshot = CAST(:source_set AS jsonb),
                        snapshot_sha256 = :snapshot_hash
                    WHERE id = :run_id
                    """
                ),
                {
                    "run_id": row["id"],
                    "config": _canonical_json(config),
                    "source_set": _canonical_json(source_set),
                    "snapshot_hash": final_hash,
                },
            )
            repaired += 1
    return repaired


def _normalized_config(row: Any) -> dict[str, Any]:
    existing = row["config_snapshot"]
    config = dict(existing) if isinstance(existing, dict) else {}
    normalized = {
        "scope": config.get("scope", row["scope"]),
        "mode": config.get("mode", row["mode"]),
        "postLimit": config.get("postLimit", row["post_limit"]),
        "taskRevision": config.get("taskRevision", row["task_revision"]),
    }
    if normalized["scope"] not in {"all", "selected"}:
        raise RuntimeError(f"TaskRun {row['id']} has no reconstructable scope")
    if normalized["mode"] not in {"recent_posts", "recheck_group"}:
        raise RuntimeError(f"TaskRun {row['id']} has no reconstructable mode")
    try:
        post_limit = int(normalized["postLimit"])
        task_revision = int(normalized["taskRevision"])
    except (TypeError, ValueError) as exc:
        raise RuntimeError(
            f"TaskRun {row['id']} has invalid frozen numeric configuration"
        ) from exc
    if not 1 <= post_limit <= 100 or task_revision < 0:
        raise RuntimeError(
            f"TaskRun {row['id']} has invalid frozen configuration values"
        )
    normalized["postLimit"] = post_limit
    normalized["taskRevision"] = task_revision
    return normalized


def _normalized_source_set(connection: Connection, row: Any) -> list[dict[str, Any]]:
    existing = row["source_set_snapshot"]
    if _valid_source_set(existing):
        return [dict(item) for item in existing]
    demands = connection.execute(
        sa.text(
            """
            SELECT payload
            FROM task_run_source_demands
            WHERE task_run_id = :run_id
            ORDER BY created_at, id
            """
        ),
        {"run_id": row["id"]},
    ).scalars()
    source_set = [dict(payload) for payload in demands if isinstance(payload, dict)]
    if not _valid_source_set(source_set):
        raise RuntimeError(
            f"TaskRun {row['id']} has no reconstructable source snapshot"
        )
    return source_set


def _valid_source_set(value: Any) -> bool:
    if not isinstance(value, list) or not value:
        return False
    required = {
        "sourceId",
        "provider",
        "sourceType",
        "externalId",
        "ownerId",
        "sourceRevision",
        "taskRevision",
    }
    return all(isinstance(item, dict) and required <= set(item) for item in value)


def _snapshot_hash(
    config: dict[str, Any],
    source_set: list[dict[str, Any]],
    source_set_revision: int,
) -> str:
    payload = {
        "config": config,
        "sourceSet": source_set,
        "sourceSetRevision": source_set_revision,
    }
    return hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()


def _canonical_json(value: Any) -> str:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )
