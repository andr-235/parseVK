from app.db.models import Task, TaskAuditLog


def task_to_response(task: Task) -> dict:
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "completed": task.status == "done",
        "totalItems": task.total_items,
        "processedItems": task.processed_items,
        "progress": task.progress,
        "status": task.status,
        "scope": task.scope,
        "mode": task.mode,
        "groupIds": task.group_ids,
        "postLimit": task.post_limit,
        "source": task.source,
        "stats": task.stats,
        "error": task.error,
        "skippedGroupsMessage": task.skipped_groups_message,
        "createdAt": task.created_at.isoformat(),
        "updatedAt": task.updated_at.isoformat(),
    }


def audit_to_response(audit: TaskAuditLog) -> dict:
    return {
        "id": audit.id,
        "taskId": audit.task_id,
        "aggregateType": audit.aggregate_type,
        "aggregateId": audit.aggregate_id,
        "eventType": audit.event_type,
        "eventData": audit.event_data,
        "createdAt": audit.created_at.isoformat(),
    }
