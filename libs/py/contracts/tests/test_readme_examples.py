from __future__ import annotations

import runpy
from pathlib import Path

README = Path(__file__).resolve().parents[1] / "README.md"
START = "<!-- executable-contract-example:start -->"
END = "<!-- executable-contract-example:end -->"


def executable_example() -> str:
    text = README.read_text(encoding="utf-8")
    section = text.split(START, 1)[1].split(END, 1)[0]
    return section.split("```python", 1)[1].split("```", 1)[0].strip()


def test_readme_contract_example_executes(tmp_path: Path):
    script = tmp_path / "readme_contract_example.py"
    script.write_text(executable_example(), encoding="utf-8")
    runpy.run_path(str(script), run_name="readme_contract_example")


def test_readme_does_not_document_removed_versioned_api():
    text = README.read_text(encoding="utf-8")
    assert "schema_version=" not in text
    assert "compatibility=" not in text
    assert "<schema_version>" not in text
    assert "generation.cli compatibility" not in text
