from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from ai_review_agents_install import install

SCRIPTS = Path(__file__).resolve().parent


def mandatory_finding() -> dict:
    return {
        "severity": "major",
        "file": "app.py",
        "line": 1,
        "scenario": "Файл содержит 151 строку при лимите 150 из AGENTS.md.",
        "impact": "Нарушено обязательное правило AGENTS.md.",
        "fix": "Разделите файл.",
        "confidence": 1.0,
    }


class RuntimeTests(unittest.TestCase):
    def test_wrapper_merges_findings_after_unavailable_core_result(self) -> None:
        directory = Path(tempfile.mkdtemp())
        wrapper = directory / "ai_review.py"
        core = directory / "ai_review_core.py"
        merger = directory / "ai_review_agents_merge.py"
        wrapper.write_text((SCRIPTS / "ai_review_agents_wrapper.py").read_text(), encoding="utf-8")
        merger.write_text((SCRIPTS / "ai_review_agents_merge.py").read_text(), encoding="utf-8")
        core.write_text(
            "import json,sys\nfrom pathlib import Path\n"
            "out=Path(sys.argv[sys.argv.index('--output')+1])\n"
            "value={'schema_version':1,'status':'technical-error','reason':'failed',"
            "'head_sha':'a'*40,'summary':'failed','findings':[],'dropped_findings':0,"
            "'verdict':'unavailable','reaction':'confused','blocking_count':0}\n"
            "out.write_text(json.dumps(value))\n",
            encoding="utf-8",
        )
        result = directory / "review-result.json"
        findings = {"head_sha": "a" * 40, "findings": [mandatory_finding()]}
        (directory / "agents-findings.json").write_text(json.dumps(findings), encoding="utf-8")
        completed = subprocess.run(  # noqa: S603 -- controlled test script
            [sys.executable, str(wrapper), "fallback", "--output", str(result)],
            check=False,
        )
        payload = json.loads(result.read_text(encoding="utf-8"))
        self.assertEqual(completed.returncode, 0)
        self.assertEqual(payload["verdict"], "changes-required")
        self.assertEqual(payload["blocking_count"], 1)

    def test_installer_preserves_core_and_installs_trusted_runtime(self) -> None:
        directory = Path(tempfile.mkdtemp())
        (directory / "ai_review.py").write_text("print('core')\n", encoding="utf-8")
        sources = {
            ".github/scripts/ai_review_agents_wrapper.py": "print('wrapper')\n",
            ".github/scripts/ai_review_agents_merge.py": "print('merger')\n",
        }
        with patch("ai_review_agents_install.read_at_ref", side_effect=lambda _b, p, _r: sources[p]):
            install("a" * 40, directory, directory)
        self.assertEqual((directory / "ai_review_core.py").read_text(), "print('core')\n")
        self.assertEqual((directory / "ai_review.py").read_text(), "print('wrapper')\n")
        self.assertEqual(
            (directory / "ai_review_agents_merge.py").read_text(),
            "print('merger')\n",
        )


if __name__ == "__main__":
    unittest.main()
