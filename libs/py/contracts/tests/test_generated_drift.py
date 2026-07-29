"""Test that generated artifacts are up to date with contracts."""

from __future__ import annotations

from parsevk_contracts.generation.cli import check


def test_drift_check_passes() -> None:
    """Generated artifacts match a fresh generation (no drift)."""
    result = check(output_dir="generated")
    assert result == 0, "Drift detected in generated artifacts"
