from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import ai_review_batch


class UnavailableBatchTests(unittest.TestCase):
    def test_aggregate_writes_result_and_returns_failure(self) -> None:
        with tempfile.TemporaryDirectory() as value:
            directory = Path(value)
            plan = directory / "plan.json"
            results = directory / "results"
            output = directory / "result.json"
            results.mkdir()
            plan.write_text(
                json.dumps(
                    {
                        "run_head_sha": "2" * 40,
                        "status": "review",
                        "units": [
                            {
                                "index": "001",
                                "base_sha": "1" * 40,
                                "head_sha": "2" * 40,
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )
            exit_code = ai_review_batch.main(
                [
                    "aggregate",
                    "--plan",
                    str(plan),
                    "--results-dir",
                    str(results),
                    "--output",
                    str(output),
                ]
            )
            payload = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(exit_code, 2)
            self.assertEqual(payload["verdict"], "unavailable")


if __name__ == "__main__":
    unittest.main()
