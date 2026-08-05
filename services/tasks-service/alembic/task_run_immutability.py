"""Harden TaskRun snapshots and add explicit resume lineage."""

from __future__ import annotations

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import sqlalchemy as sa
from alembic import op

_REPAIR_PATH = Path(__file__).with_name("task_run_snapshot_repair.py")
_SPEC = spec_from_file_location("_task_run_snapshot_repair", _REPAIR_PATH)
if _SPEC is None or _SPEC.loader is None:
    raise RuntimeError(f"Cannot load TaskRun repair helper: {_REPAIR_PATH}")
_REPAIR = module_from_spec(_SPEC)
_SPEC.loader.exec_module(_REPAIR)

LEGACY_FUNCTION = "reject_task_run_snapshot_update"
LEGACY_TRIGGER = "trg_task_runs_immutable_snapshot"
IMMUTABILITY_FUNCTION = "enforce_task_run_immutable_fields"
IMMUTABILITY_TRIGGER = "trg_task_runs_immutable_fields"


def upgrade() -> None:
    op.add_column(
        "task_runs",
        sa.Column("resumed_from_task_run_id", sa.Uuid(), nullable=True),
    )
    op.add_column(
        "task_runs",
        sa.Column("retry_reason", sa.String(length=1000), nullable=True),
    )

    # P1 already made the snapshot columns non-null, added the SHA constraint,
    # and installed a trigger that blocks snapshot repair. Replace only the
    # parts that need stronger semantics instead of recreating existing DDL.
    _drop_legacy_immutability_trigger()
    _REPAIR.repair_task_run_snapshots(op.get_bind())

    op.drop_constraint("ck_task_runs_run_revision", "task_runs", type_="check")
    op.create_check_constraint(
        "ck_task_runs_run_revision",
        "task_runs",
        "run_revision >= 1",
    )
    op.create_check_constraint(
        "ck_task_runs_config_snapshot",
        "task_runs",
        """
        jsonb_typeof(config_snapshot) = 'object'
        AND config_snapshot ?& ARRAY['scope', 'mode', 'postLimit', 'taskRevision']
        AND config_snapshot->>'scope' IN ('all', 'selected')
        AND config_snapshot->>'mode' IN ('recent_posts', 'recheck_group')
        AND jsonb_typeof(config_snapshot->'postLimit') = 'number'
        AND (config_snapshot->>'postLimit')::integer BETWEEN 1 AND 100
        AND jsonb_typeof(config_snapshot->'taskRevision') = 'number'
        AND (config_snapshot->>'taskRevision')::integer >= 0
        """,
    )
    op.drop_constraint(
        "ck_task_runs_source_set_array",
        "task_runs",
        type_="check",
    )
    op.create_check_constraint(
        "ck_task_runs_source_set_snapshot",
        "task_runs",
        """
        jsonb_typeof(source_set_snapshot) = 'array'
        AND jsonb_array_length(source_set_snapshot) > 0
        """,
    )
    op.create_check_constraint(
        "ck_task_runs_resume_not_self",
        "task_runs",
        "resumed_from_task_run_id IS NULL OR resumed_from_task_run_id <> id",
    )
    op.create_check_constraint(
        "ck_task_runs_retry_reason_length",
        "task_runs",
        "retry_reason IS NULL OR length(trim(retry_reason)) BETWEEN 1 AND 1000",
    )
    op.create_foreign_key(
        "fk_task_runs_resumed_from",
        "task_runs",
        "task_runs",
        ["resumed_from_task_run_id"],
        ["id"],
        deferrable=True,
        initially="DEFERRED",
    )
    op.create_index(
        "ix_task_runs_resumed_from",
        "task_runs",
        ["resumed_from_task_run_id"],
    )
    _create_immutability_trigger()


def downgrade() -> None:
    op.execute(
        f"DROP TRIGGER IF EXISTS {IMMUTABILITY_TRIGGER} ON task_runs"
    )
    op.execute(f"DROP FUNCTION IF EXISTS {IMMUTABILITY_FUNCTION}()")
    op.drop_index("ix_task_runs_resumed_from", table_name="task_runs")
    op.drop_constraint(
        "fk_task_runs_resumed_from",
        "task_runs",
        type_="foreignkey",
    )
    for name in (
        "ck_task_runs_retry_reason_length",
        "ck_task_runs_resume_not_self",
        "ck_task_runs_source_set_snapshot",
        "ck_task_runs_config_snapshot",
    ):
        op.drop_constraint(name, "task_runs", type_="check")
    op.create_check_constraint(
        "ck_task_runs_source_set_array",
        "task_runs",
        "jsonb_typeof(source_set_snapshot) = 'array'",
    )
    op.drop_constraint("ck_task_runs_run_revision", "task_runs", type_="check")
    op.create_check_constraint(
        "ck_task_runs_run_revision",
        "task_runs",
        "run_revision >= 0",
    )
    op.drop_column("task_runs", "retry_reason")
    op.drop_column("task_runs", "resumed_from_task_run_id")
    _create_legacy_immutability_trigger()


def _drop_legacy_immutability_trigger() -> None:
    op.execute(f"DROP TRIGGER IF EXISTS {LEGACY_TRIGGER} ON task_runs")
    op.execute(f"DROP FUNCTION IF EXISTS {LEGACY_FUNCTION}()")


def _create_legacy_immutability_trigger() -> None:
    op.execute(
        f"""
        CREATE FUNCTION {LEGACY_FUNCTION}() RETURNS trigger AS $$
        BEGIN
            IF NEW.task_id IS DISTINCT FROM OLD.task_id
               OR NEW.run_revision IS DISTINCT FROM OLD.run_revision
               OR NEW.source_set_revision IS DISTINCT FROM OLD.source_set_revision
               OR NEW.snapshot_sha256 IS DISTINCT FROM OLD.snapshot_sha256
               OR NEW.config_snapshot IS DISTINCT FROM OLD.config_snapshot
               OR NEW.source_set_snapshot IS DISTINCT FROM OLD.source_set_snapshot
               OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
                RAISE EXCEPTION 'task run snapshot fields are immutable';
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
        """
    )
    op.execute(
        f"""
        CREATE TRIGGER {LEGACY_TRIGGER}
        BEFORE UPDATE ON task_runs
        FOR EACH ROW EXECUTE FUNCTION {LEGACY_FUNCTION}()
        """
    )


def _create_immutability_trigger() -> None:
    op.execute(
        f"""
        CREATE FUNCTION {IMMUTABILITY_FUNCTION}() RETURNS trigger AS $$
        DECLARE
            parent_task_id bigint;
            parent_status varchar(32);
        BEGIN
            IF TG_OP = 'UPDATE' AND (
                NEW.task_id,
                NEW.run_revision,
                NEW.source_set_revision,
                NEW.snapshot_sha256,
                NEW.config_snapshot,
                NEW.source_set_snapshot,
                NEW.resumed_from_task_run_id,
                NEW.retry_reason,
                NEW.created_at
            ) IS DISTINCT FROM (
                OLD.task_id,
                OLD.run_revision,
                OLD.source_set_revision,
                OLD.snapshot_sha256,
                OLD.config_snapshot,
                OLD.source_set_snapshot,
                OLD.resumed_from_task_run_id,
                OLD.retry_reason,
                OLD.created_at
            ) THEN
                RAISE EXCEPTION 'TaskRun frozen fields are immutable'
                    USING ERRCODE = '23514';
            END IF;

            IF NEW.resumed_from_task_run_id IS NOT NULL THEN
                SELECT task_id, status
                INTO parent_task_id, parent_status
                FROM task_runs
                WHERE id = NEW.resumed_from_task_run_id;
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'TaskRun resume parent does not exist'
                        USING ERRCODE = '23503';
                END IF;
                IF parent_task_id <> NEW.task_id THEN
                    RAISE EXCEPTION 'TaskRun resume parent belongs to another task'
                        USING ERRCODE = '23514';
                END IF;
                IF parent_status NOT IN ('completed', 'failed', 'cancelled') THEN
                    RAISE EXCEPTION 'TaskRun resume parent is not terminal'
                        USING ERRCODE = '23514';
                END IF;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
        """
    )
    op.execute(
        f"""
        CREATE TRIGGER {IMMUTABILITY_TRIGGER}
        BEFORE INSERT OR UPDATE ON task_runs
        FOR EACH ROW EXECUTE FUNCTION {IMMUTABILITY_FUNCTION}()
        """
    )
