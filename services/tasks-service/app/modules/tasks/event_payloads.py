def task_request_payload(task, owner_user_id: str) -> dict:
    return {
        "taskId": str(task.id),
        "ownerUserId": owner_user_id,
        "runId": task.execution_run_id,
        "scope": task.scope,
        "mode": task.mode,
        "groupIds": task.group_ids,
        "postLimit": task.post_limit,
        "source": task.source,
    }


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
