"""Alembic wrapper for immutable TaskRun snapshots and resume lineage.

Revision ID: p2h3_task_run_immutable
Revises: p2h1_source_set_revision
"""

from __future__ import annotations

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

_HELPER = Path(__file__).parents[1] / "task_run_immutability.py"
_SPEC = spec_from_file_location("_task_run_immutability", _HELPER)
if _SPEC is None or _SPEC.loader is None:
    raise RuntimeError(f"Cannot load migration helper: {_HELPER}")
_MODULE = module_from_spec(_SPEC)
_SPEC.loader.exec_module(_MODULE)

revision = "p2h3_task_run_immutable"
down_revision = "p2h1_source_set_revision"
branch_labels = None
depends_on = None
upgrade = _MODULE.upgrade
downgrade = _MODULE.downgrade
