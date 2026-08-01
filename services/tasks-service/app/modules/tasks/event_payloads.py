from datetime import UTC, datetime


def task_request_payload(task, owner_user_id: str, run_meta: dict | None = None) -> dict:
    payload = {
        "taskId": str(task.id),
        "ownerUserId": owner_user_id,
        "runId": task.execution_run_id,
        "scope": task.scope,
        "mode": task.mode,
        "groupIds": task.group_ids,
        "postLimit": task.post_limit,
        "source": task.source,
    }
    if run_meta:
        payload.update(run_meta)
    return payload


def task_identity_payload(task, owner_user_id: str) -> dict:
    return {
        "taskId": str(task.id),
        "ownerUserId": owner_user_id,
        "runId": task.execution_run_id,
    }


def task_snapshot(task) -> dict:
    return {
        "taskId": str(task.id),
        "status": task.status,
        "scope": task.scope,
        "mode": task.mode,
        "groupIds": task.group_ids,
        "postLimit": task.post_limit,
    }


def task_state_changed_payload(task) -> dict:
    return {
        "taskId": task.id,
        "runId": task.execution_run_id,
        "ownerUserId": task.owner_user_id,
        "status": task.status,
        "taskRevision": task.revision,
        "processedItems": task.processed_items,
        "totalItems": task.total_items,
        "progress": task.progress,
        "stats": task.stats,
        "changedAt": task.updated_at.isoformat() if task.updated_at else datetime.now(UTC).isoformat(),
    }
