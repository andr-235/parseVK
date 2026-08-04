"""Alembic wrapper for the canonical source-level collection cutover.

Revision ID: pr6b_source_collection_identity
Revises: pr6_source_collection_demands
"""

from __future__ import annotations

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

_HELPER = Path(__file__).parents[1] / "source_level_collection_identity.py"
_SPEC = spec_from_file_location("_source_level_collection_identity", _HELPER)
if _SPEC is None or _SPEC.loader is None:
    raise RuntimeError(f"Cannot load migration helper: {_HELPER}")
_MODULE = module_from_spec(_SPEC)
_SPEC.loader.exec_module(_MODULE)

revision = "pr6b_source_collection_identity"
down_revision = "pr6_source_collection_demands"
branch_labels = None
depends_on = None
upgrade = _MODULE.upgrade
downgrade = _MODULE.downgrade
