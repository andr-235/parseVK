from __future__ import annotations

import json
from pathlib import Path

from parsevk_contracts.generation.policy_layout import validate_unversioned_layout


def make_root(tmp_path: Path, *, message_type: str = "test.event") -> Path:
    for name in ("parsevk_contracts", "generated", "examples"):
        (tmp_path / name).mkdir()
    (tmp_path / "generated" / "manifest.json").write_text(
        json.dumps({"contracts": [{"messageType": message_type}]}),
        encoding="utf-8",
    )
    return tmp_path


def test_valid_unversioned_layout_passes(tmp_path: Path):
    assert validate_unversioned_layout(make_root(tmp_path)) == ()


def test_rejects_legacy_markers_and_compatibility_package(tmp_path: Path):
    root = make_root(tmp_path)
    package = root / "parsevk_contracts" / "compatibility"
    package.mkdir()
    (package / "models.py").write_text("schema_version = 1", encoding="utf-8")

    violations = validate_unversioned_layout(root)

    assert any("compatibility runtime package" in item for item in violations)
    assert any("schema_version" in item for item in violations)


def test_rejects_numeric_paths_and_message_type_versions(tmp_path: Path):
    root = make_root(tmp_path, message_type="test.event.v2")
    version_dir = root / "examples" / "v2"
    version_dir.mkdir()
    (version_dir / "1.json").write_text("{}", encoding="utf-8")

    violations = validate_unversioned_layout(root)

    assert any("numeric version directory" in item for item in violations)
    assert any("numeric schema filename" in item for item in violations)
    assert any("numeric message-type versions" in item for item in violations)
