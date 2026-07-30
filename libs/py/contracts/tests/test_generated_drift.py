"""Test that generated artifacts are up to date with contracts."""
from __future__ import annotations

from pathlib import Path

from parsevk_contracts.generation.cli import check

GENERATED_DIR = str(Path(__file__).resolve().parent.parent / "generated")


def test_drift_check_passes() -> None:
    result = check(output_dir=GENERATED_DIR)
    assert result == 0, "Drift detected in generated artifacts"
