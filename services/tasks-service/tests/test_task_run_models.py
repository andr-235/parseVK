from app.db.models import TaskRun


def constraint_names() -> set[str]:
    return {
        constraint.name
        for constraint in TaskRun.__table__.constraints
        if constraint.name
    }


def index_names() -> set[str]:
    return {index.name for index in TaskRun.__table__.indexes if index.name}


def test_task_run_snapshot_columns_are_required():
    columns = TaskRun.__table__.columns
    assert columns["snapshot_sha256"].nullable is False
    assert columns["config_snapshot"].nullable is False
    assert columns["source_set_snapshot"].nullable is False


def test_task_run_has_explicit_resume_lineage():
    columns = TaskRun.__table__.columns
    assert "resumed_from_task_run_id" in columns
    assert "retry_reason" in columns
    assert columns["resumed_from_task_run_id"].nullable is True
    assert columns["retry_reason"].type.length == 1000
    assert "ix_task_runs_resumed_from" in index_names()


def test_task_run_has_snapshot_and_lineage_constraints():
    names = constraint_names()
    assert "ck_task_runs_run_revision" in names
    assert "ck_task_runs_snapshot_sha256_length" in names
    assert "ck_task_runs_resume_not_self" in names
    assert "ck_task_runs_retry_reason_length" in names
