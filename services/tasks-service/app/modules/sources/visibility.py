from sqlalchemy import exists, or_, select

from app.db.models import (
    AccessScope,
    MonitoringSource,
    ScopeSourceAccess,
    SourceRegistration,
    Task,
    TaskSource,
)


def owner_visibility_clause(owner_user_id: str):
    registered_to_owner = exists(
        select(1)
        .select_from(SourceRegistration)
        .where(
            SourceRegistration.source_id == MonitoringSource.id,
            SourceRegistration.owner_user_id == owner_user_id,
        )
    )
    linked_to_owner = exists(
        select(1)
        .select_from(TaskSource)
        .join(Task, Task.id == TaskSource.task_id)
        .where(
            TaskSource.source_id == MonitoringSource.id,
            Task.owner_user_id == owner_user_id,
        )
    )
    granted_to_owner_scope = exists(
        select(1)
        .select_from(ScopeSourceAccess)
        .join(
            AccessScope,
            AccessScope.id == ScopeSourceAccess.access_scope_id,
        )
        .where(
            ScopeSourceAccess.source_id == MonitoringSource.id,
            AccessScope.owner_user_id == owner_user_id,
            ScopeSourceAccess.ref_count > 0,
            ScopeSourceAccess.revoked_at.is_(None),
        )
    )
    return or_(
        registered_to_owner,
        MonitoringSource.owner_user_id == owner_user_id,
        linked_to_owner,
        granted_to_owner_scope,
    )
