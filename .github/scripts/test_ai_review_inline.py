from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from ai_review_ui.models import PublishError, load_result


class ModelTests(unittest.TestCase):
    def test_load_result_rejects_path_traversal(self) -> None:
        payload = {
            "head_sha": "a" * 40,
            "status": "completed",
            "reason": "review-completed",
            "summary": "summary",
            "verdict": "findings",
            "blocking_count": 0,
            "findings": [
                {
                    "severity": "minor",
                    "file": "../secret.py",
                    "line": 1,
                    "scenario": "scenario",
                    "impact": "impact",
                    "fix": "fix",
                    "confidence": 0.95,
                }
            ],
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "result.json"
            path.write_text(json.dumps(payload), encoding="utf-8")
            with self.assertRaises(PublishError):
                load_result(path)


if __name__ == "__main__":
    unittest.main()
