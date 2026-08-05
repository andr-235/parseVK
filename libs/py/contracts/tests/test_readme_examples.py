from __future__ import annotations

import re
import runpy
from pathlib import Path

README = Path(__file__).resolve().parents[1] / "README.md"
PYTHON_BLOCK = re.compile(r"```python\n(?P<code>.*?)\n```", re.DOTALL)


def documented_python_examples() -> tuple[str, ...]:
    text = README.read_text(encoding="utf-8")
    return tuple(match.group("code").strip() for match in PYTHON_BLOCK.finditer(text))


def test_all_readme_python_examples_execute(tmp_path: Path):
    examples = documented_python_examples()
    assert examples
    for index, example in enumerate(examples):
        script = tmp_path / f"readme_contract_example_{index}.py"
        script.write_text(example, encoding="utf-8")
        runpy.run_path(str(script), run_name=f"readme_contract_example_{index}")


def test_readme_does_not_document_removed_versioned_api():
    text = README.read_text(encoding="utf-8")
    assert "schema_version=" not in text
    assert "compatibility=" not in text
    assert "<schema_version>" not in text
    assert "generation.cli compatibility" not in text
